"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { addMouse, editMouse, getMice, removeMouse } from "@/lib/api";
import { SLOTS, tierOf } from "@/lib/tiers";
import { formatName } from "@/lib/format";
import { Mouse, MouseInput, SlotId } from "@/lib/types";
import MouseForm from "./MouseForm";
import MouseAvatar from "./MouseAvatar";

export interface RosterCaps {
  canAdd: boolean;
  canTierEdit: boolean;
  canPwView: boolean;
  canPwEdit: boolean;
  canDelete: boolean;
}

/**
 * Hem admin panelinin (tam yetki) hem yetkili panelinin (izne göre) kullandığı
 * kadro yöneticisi. Fareler sürükle-bırak ile tier'lar arasında taşınır ve
 * sıralanır; dokunmatik için açılır liste ve ok tuşları da durur.
 */
export default function RosterManager({
  caps,
  onToast,
}: {
  caps: RosterCaps;
  onToast: (msg: string, kind?: "ok" | "err") => void;
}) {
  const [mice, setMice] = useState<Mouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Mouse | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // sürükle-bırak durumu
  const [dragId, setDragId] = useState<string | null>(null);
  const [overSlot, setOverSlot] = useState<SlotId | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      setMice(await getMice(caps.canPwView));
    } catch (e: any) {
      onToast(e?.message ?? "Liste yüklenemedi", "err");
    } finally {
      setLoading(false);
    }
  }, [caps.canPwView, onToast]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /**
   * Sürükleme sırasında otomatik kaydırma. 69 fareyle bir fareyi en alttan
   * en üste taşımak için, imleci ekranın üst/alt kenarına götürünce sayfa
   * kendiliğinden kayar. Yalnızca sürükleme sürerken çalışır; hiçbir veriye
   * dokunmaz, tamamen görsel kolaylık.
   */
  useEffect(() => {
    if (!dragId) return;
    const KENAR = 110; // kenardan bu kadar px içeride kaydırma başlar
    const MAKS = 22; // kare başına en yüksek kaydırma hızı
    let hiz = 0;
    let raf = 0;
    const uzerinde = (e: DragEvent) => {
      const y = e.clientY;
      const h = window.innerHeight;
      if (y < KENAR) hiz = -Math.ceil(((KENAR - y) / KENAR) * MAKS);
      else if (y > h - KENAR) hiz = Math.ceil(((y - (h - KENAR)) / KENAR) * MAKS);
      else hiz = 0;
    };
    const tik = () => {
      if (hiz !== 0) window.scrollBy(0, hiz);
      raf = requestAnimationFrame(tik);
    };
    window.addEventListener("dragover", uzerinde);
    raf = requestAnimationFrame(tik);
    return () => {
      window.removeEventListener("dragover", uzerinde);
      cancelAnimationFrame(raf);
    };
  }, [dragId]);

  const grouped = useMemo(() => {
    const map: Record<string, Mouse[]> = {};
    for (const s of SLOTS) map[s.id] = [];
    for (const m of mice) (map[m.tier] ?? map["de"]).push(m);
    for (const id of Object.keys(map))
      map[id].sort(
        (a, b) =>
          (a.sort ?? 0) - (b.sort ?? 0) || a.nickname.localeCompare(b.nickname)
      );
    return map;
  }, [mice]);

  function nextSortIn(tier: SlotId): number {
    const inTier = mice.filter((m) => m.tier === tier);
    return inTier.length ? Math.max(...inTier.map((m) => m.sort ?? 0)) + 1 : 0;
  }

  /* ------------------------------ CRUD -------------------------------- */

  async function handleAdd(input: MouseInput) {
    await addMouse({ ...input, sort: nextSortIn(input.tier) });
    onToast(`"${formatName(input.nickname)}" eklendi (${tierOf(input.tier).label}).`);
    await refresh();
  }

  /**
   * SADECE gerçekten değişen alanları gönderir.
   *
   * Eskiden formdaki bütün alanlar geri yazılıyordu. Form bir alanı
   * yükleyememişse (şifre, yetkiler) o alan boş değeriyle üzerine
   * yazılıyor ve hesap bozuluyordu. Yetkiler ve epoch buradan ASLA
   * gönderilmez — yetkiler kendi panelinden yönetilir.
   */
  async function handleUpdate(input: MouseInput) {
    if (!editing) return;
    const patch: Partial<MouseInput> = {};

    if (input.nickname !== editing.nickname) patch.nickname = input.nickname;
    if (input.title !== editing.title) patch.title = input.title;
    if (input.image_url !== editing.image_url) patch.image_url = input.image_url;
    if (input.username !== editing.username) patch.username = input.username;
    if (input.tier !== editing.tier) {
      patch.tier = input.tier;
      patch.sort = nextSortIn(input.tier);
    }
    // Şifre yalnızca yetkin varsa VE gerçekten yeni bir değer girildiyse.
    if (
      caps.canPwEdit &&
      input.password &&
      input.password !== editing.password
    )
      patch.password = input.password;

    if (Object.keys(patch).length === 0) {
      onToast("Değişiklik yok.");
      setEditing(null);
      return;
    }

    await editMouse(editing.id, patch);
    onToast(`"${formatName(input.nickname)}" güncellendi.`);
    setEditing(null);
    await refresh();
  }

  async function handleDelete(m: Mouse) {
    try {
      await removeMouse(m.id);
      onToast(`"${formatName(m.nickname)}" silindi.`);
    } catch (e: any) {
      onToast(e?.message ?? "Silinemedi", "err");
    }
    setConfirmId(null);
    await refresh();
  }

  async function handleMove(m: Mouse, tier: SlotId) {
    if (tier === m.tier) return;
    try {
      await editMouse(m.id, { tier, sort: nextSortIn(tier) });
      onToast(`"${formatName(m.nickname)}" → ${tierOf(tier).label}`);
    } catch (e: any) {
      onToast(e?.message ?? "Taşınamadı", "err");
    }
    await refresh();
  }

  async function handleReorder(m: Mouse, dir: "up" | "down") {
    const list = [...(grouped[m.tier] ?? [])];
    const idx = list.findIndex((x) => x.id === m.id);
    const j = dir === "up" ? idx - 1 : idx + 1;
    if (j < 0 || j >= list.length) return;
    [list[idx], list[j]] = [list[j], list[idx]];
    try {
      await Promise.all(
        list
          .map((x, i) => (x.sort === i ? null : editMouse(x.id, { sort: i })))
          .filter(Boolean) as Promise<unknown>[]
      );
    } catch (e: any) {
      onToast(e?.message ?? "Sıralanamadı", "err");
    }
    await refresh();
  }

  /* --------------------------- sürükle-bırak --------------------------- */

  function clearDrag() {
    setDragId(null);
    setOverSlot(null);
    setOverIndex(null);
  }

  /** Sürüklenen fareyi hedef bölgenin verilen sırasına yerleştirir. */
  async function handleDrop(targetSlot: SlotId, targetIndex: number) {
    const id = dragId;
    clearDrag();
    if (!id) return;
    const dragged = mice.find((m) => m.id === id);
    if (!dragged) return;

    const sourceSlot = dragged.tier as SlotId;
    const sourceList = [...(grouped[sourceSlot] ?? [])];
    const fromIdx = sourceList.findIndex((m) => m.id === id);

    try {
      if (sourceSlot === targetSlot) {
        // aynı bölge içinde sıralama
        const list = sourceList.filter((m) => m.id !== id);
        const insertAt = Math.max(
          0,
          Math.min(targetIndex > fromIdx ? targetIndex - 1 : targetIndex, list.length)
        );
        if (insertAt === fromIdx) return; // yer değişmedi
        list.splice(insertAt, 0, dragged);
        await Promise.all(
          list
            .map((m, i) => (m.sort === i ? null : editMouse(m.id, { sort: i })))
            .filter(Boolean) as Promise<unknown>[]
        );
      } else {
        // başka bölgeye taşıma
        const targetList = [...(grouped[targetSlot] ?? [])];
        const insertAt = Math.max(0, Math.min(targetIndex, targetList.length));
        targetList.splice(insertAt, 0, dragged);

        await Promise.all(
          targetList
            .map((m, i) =>
              m.id === id
                ? editMouse(m.id, { tier: targetSlot, sort: i })
                : m.sort === i
                ? null
                : editMouse(m.id, { sort: i })
            )
            .filter(Boolean) as Promise<unknown>[]
        );

        // kaynak bölgeyi yeniden numaralandır
        const rest = sourceList.filter((m) => m.id !== id);
        await Promise.all(
          rest
            .map((m, i) => (m.sort === i ? null : editMouse(m.id, { sort: i })))
            .filter(Boolean) as Promise<unknown>[]
        );

        onToast(
          `"${formatName(dragged.nickname)}" → ${tierOf(targetSlot).label}`
        );
      }
    } catch (e: any) {
      onToast(e?.message ?? "Taşınamadı", "err");
    }
    await refresh();
  }

  return (
    <div>
      {caps.canAdd && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong sys-window mb-6 p-5 sm:p-6"
        >
          <div className="mb-4 font-display text-base font-bold uppercase tracking-[0.12em] text-teal-deep">
            Yeni Fare Ekle
          </div>
          <MouseForm
            submitLabel="Tierlist'e Ekle"
            canEditPassword={caps.canPwEdit || caps.canPwView}
            onSubmit={handleAdd}
          />
        </motion.div>
      )}

      <div className="mb-1 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold uppercase tracking-tight text-choco">
          Fareleri Yönet
        </h2>
        <span className="font-display text-xs font-bold uppercase tracking-widest text-choco/50 tabular-nums">
          {mice.length} fare
        </span>
      </div>
      {caps.canTierEdit && (
        <p className="mb-4 font-system text-xs font-medium text-choco/45">
          Soldaki tutamaçtan sürükleyip istediğin tier'a bırak. Ara bölgeler
          (M × S gibi) burada hep görünür; public sayfada sadece içi doluysa
          görünür.
        </p>
      )}

      {loading ? (
        <div className="glass h-40 animate-pulse rounded-2xl" />
      ) : (
        <div className="space-y-3">
          {SLOTS.map((t) => {
            const roster = grouped[t.id] ?? [];
            const isOver = overSlot === t.id;
            const isBetween = t.kind === "between";

            return (
              <div
                key={t.id}
                onDragOver={(e) => {
                  if (!caps.canTierEdit || !dragId) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  setOverSlot(t.id as SlotId);
                  setOverIndex((cur) => (isOver && cur !== null ? cur : roster.length));
                }}
                onDrop={(e) => {
                  if (!caps.canTierEdit || !dragId) return;
                  e.preventDefault();
                  handleDrop(t.id as SlotId, overIndex ?? roster.length);
                }}
                className="rounded-xl transition-all"
                style={{
                  background: isOver ? `${t.accent}12` : "transparent",
                  outline: isOver ? `2px dashed ${t.accent}88` : "2px dashed transparent",
                  outlineOffset: "4px",
                }}
              >
                <div
                  className="sticky top-0 z-10 mb-1.5 flex items-center gap-2 rounded-lg py-1.5 font-display text-xs font-bold uppercase tracking-wider backdrop-blur-md"
                  style={{
                    color: t.deep,
                    background:
                      "linear-gradient(180deg, rgba(9,12,20,0.96), rgba(9,12,20,0.72))",
                  }}
                >
                  <span
                    className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold text-white"
                    style={{
                      background: `linear-gradient(145deg, ${t.accent}, ${t.accent2})`,
                    }}
                  >
                    {t.sigil}
                  </span>
                  {t.label}
                  <span className="text-[11px] font-bold text-choco/35 tabular-nums">
                    ({roster.length})
                  </span>
                  {isBetween && (
                    <span className="rounded-full border border-white/12 bg-white/[0.04] px-2 py-0.5 font-display text-[9px] font-bold uppercase tracking-wider text-choco/45">
                      Ara Bölge
                    </span>
                  )}
                  <span
                    className="ml-auto h-px flex-1 max-w-[40%] rounded-full opacity-40"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${t.accent})`,
                    }}
                  />
                </div>

                <div className="space-y-1">
                  {roster.length === 0 ? (
                    <div
                      className="rounded-lg border-2 border-dashed px-3 py-2 text-center text-xs font-medium italic transition-colors"
                      style={{
                        borderColor: isOver ? `${t.accent}88` : "rgba(255,255,255,0.08)",
                        color: isOver ? t.deep : "rgba(232,237,244,0.3)",
                      }}
                    >
                      {isOver ? "Buraya bırak" : "boş"}
                    </div>
                  ) : (
                    <>
                      {roster.map((m, i) => (
                        <div key={m.id}>
                          {isOver && overIndex === i && (
                            <InsertLine color={t.accent} />
                          )}
                          <RosterRow
                            mouse={m}
                            index={i}
                            count={roster.length}
                            caps={caps}
                            dragging={dragId === m.id}
                            confirming={confirmId === m.id}
                            onDragStart={() => setDragId(m.id)}
                            onDragEnd={clearDrag}
                            onRowDragOver={(before) => {
                              setOverSlot(t.id as SlotId);
                              setOverIndex(before ? i : i + 1);
                            }}
                            onEdit={() => setEditing(m)}
                            onAskDelete={() => setConfirmId(m.id)}
                            onCancelDelete={() => setConfirmId(null)}
                            onConfirmDelete={() => handleDelete(m)}
                            onMove={(tier) => handleMove(m, tier)}
                            onReorder={(dir) => handleReorder(m, dir)}
                          />
                        </div>
                      ))}
                      {isOver && overIndex === roster.length && (
                        <InsertLine color={t.accent} />
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Düzenleme penceresi */}
      <AnimatePresence>
        {editing && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-abyss/92 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEditing(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 8 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong sys-window max-h-[92vh] w-full max-w-xl overflow-y-auto p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="font-display text-base font-bold uppercase tracking-[0.12em] text-teal-deep">
                  Fareyi Düzenle
                </span>
                <button
                  className="text-choco/50 hover:text-choco"
                  onClick={() => setEditing(null)}
                  aria-label="Kapat"
                >
                  ×
                </button>
              </div>
              <MouseForm
                initial={editing}
                submitLabel="Kaydet"
                canEditPassword={caps.canPwEdit}
                onSubmit={handleUpdate}
                onCancel={() => setEditing(null)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------ parçalar -------------------------------- */

function InsertLine({ color }: { color: string }) {
  return (
    <div className="relative h-0">
      <div
        className="absolute -top-1 left-0 right-0 h-[3px] rounded-full"
        style={{ background: color, boxShadow: `0 0 10px ${color}` }}
      />
    </div>
  );
}

function GripIcon() {
  return (
    <svg width="12" height="18" viewBox="0 0 12 18" fill="currentColor">
      {[3, 9, 15].map((y) =>
        [3, 9].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" />)
      )}
    </svg>
  );
}

function RosterRow({
  mouse,
  index,
  count,
  caps,
  dragging,
  confirming,
  onDragStart,
  onDragEnd,
  onRowDragOver,
  onEdit,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
  onMove,
  onReorder,
}: {
  mouse: Mouse;
  index: number;
  count: number;
  caps: RosterCaps;
  dragging: boolean;
  confirming: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onRowDragOver: (before: boolean) => void;
  onEdit: () => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  onMove: (tier: SlotId) => void;
  onReorder: (dir: "up" | "down") => void;
}) {
  const t = tierOf(mouse.tier);
  const rowRef = useRef<HTMLDivElement>(null);

  const surukleBaslat = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", mouse.id);
    if (rowRef.current) e.dataTransfer.setDragImage(rowRef.current, 24, 18);
    onDragStart();
  };

  return (
    <div
      ref={rowRef}
      onDragOver={(e) => {
        if (!caps.canTierEdit) return;
        e.preventDefault();
        e.stopPropagation();
        const r = e.currentTarget.getBoundingClientRect();
        onRowDragOver(e.clientY - r.top < r.height / 2);
      }}
      className="group glass flex items-center gap-2 overflow-hidden rounded-lg pr-2 transition-opacity"
      style={{
        borderColor: `${t.accent}30`,
        opacity: dragging ? 0.3 : 1,
      }}
    >
      {/* Tam boy renkli kulp — kolay tutulsun diye geniş bırakıldı */}
      {caps.canTierEdit && (
        <button
          draggable
          onDragStart={surukleBaslat}
          onDragEnd={onDragEnd}
          title="Sürükleyerek taşı"
          aria-label="Sürükleyerek taşı"
          className="flex cursor-grab items-center self-stretch px-2 text-choco/40 transition-colors hover:text-white active:cursor-grabbing"
          style={{ background: `${t.accent}1a` }}
        >
          <GripIcon />
        </button>
      )}

      {/* Yukarı/aşağı — bölge içinde ince ayar */}
      {caps.canTierEdit && (
        <div className="flex flex-col justify-center">
          <button
            className="h-3.5 leading-none text-[10px] text-choco/40 hover:text-teal-deep disabled:opacity-20"
            onClick={() => onReorder("up")}
            disabled={index === 0}
            aria-label="Yukarı taşı"
          >
            ▲
          </button>
          <button
            className="h-3.5 leading-none text-[10px] text-choco/40 hover:text-teal-deep disabled:opacity-20"
            onClick={() => onReorder("down")}
            disabled={index === count - 1}
            aria-label="Aşağı taşı"
          >
            ▼
          </button>
        </div>
      )}

      {/* Avatar da ikinci bir kulp — sürükleme alanı büyüsün */}
      <div
        draggable={caps.canTierEdit}
        onDragStart={caps.canTierEdit ? surukleBaslat : undefined}
        onDragEnd={caps.canTierEdit ? onDragEnd : undefined}
        className={`my-1 h-8 w-8 shrink-0 overflow-hidden rounded-md border ${
          caps.canTierEdit ? "cursor-grab active:cursor-grabbing" : ""
        }`}
        style={{ borderColor: `${t.accent}55`, background: `${t.accent}12` }}
      >
        <MouseAvatar src={mouse.image_url} alt={mouse.nickname} accent={t.accent} />
      </div>

      {/* İsim + yetkili rozeti */}
      <div className="flex min-w-0 shrink items-center gap-1.5">
        <span className="truncate font-system text-sm font-bold text-choco">
          {formatName(mouse.nickname)}
        </span>
        {(mouse.permissions?.length ?? 0) > 0 && (
          <span className="shrink-0 rounded-full bg-teal/12 px-1.5 py-0.5 font-display text-[8px] font-bold uppercase tracking-wide text-teal-deep ring-1 ring-teal/35">
            Yetkili
          </span>
        )}
      </div>

      {/* Kimlik bilgileri — dar ekranda gizlenir, geniş ekranda tek satır */}
      <div className="ml-auto hidden shrink-0 items-center gap-1.5 lg:flex">
        <CredChip label="K.adı" value={mouse.username || mouse.nickname} />
        {caps.canPwView && (
          <CredChip label="Şifre" value={mouse.password || "—"} mono />
        )}
      </div>

      {caps.canTierEdit && (
        <select
          value={mouse.tier}
          onChange={(e) => onMove(e.target.value as SlotId)}
          className="field ml-auto !w-auto max-w-[150px] shrink-0 py-1 text-xs lg:ml-0"
          aria-label="Konuma taşı"
        >
          {SLOTS.map((s) => (
            <option key={s.id} value={s.id} className="bg-void">
              {s.kind === "between" ? `↕ ${s.label}` : s.label}
            </option>
          ))}
        </select>
      )}

      {confirming ? (
        <div className="flex shrink-0 items-center gap-1">
          <span className="hidden text-xs font-bold text-red-400 sm:inline">
            Silinsin mi?
          </span>
          <button className="btn-danger px-2 py-1 text-xs" onClick={onConfirmDelete}>
            Evet
          </button>
          <button className="btn-ghost px-2 py-1 text-xs" onClick={onCancelDelete}>
            Hayır
          </button>
        </div>
      ) : (
        <div className="flex shrink-0 items-center gap-1">
          {(caps.canTierEdit || caps.canPwEdit) && (
            <button
              className="btn-ghost px-2 py-1 text-xs"
              onClick={onEdit}
              title="Düzenle"
            >
              Düzenle
            </button>
          )}
          {caps.canDelete && (
            <button
              className="btn-danger px-2 py-1 text-xs"
              onClick={onAskDelete}
              title="Sil"
            >
              Sil
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function CredChip({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(value).then(
          () => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          },
          () => {}
        );
      }}
      title={`${value} — kopyalamak için tıkla`}
      className="inline-flex max-w-[170px] items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[11px] font-semibold text-choco/70 transition hover:border-teal/50 hover:text-teal-deep"
    >
      <span className="shrink-0 font-display text-[8px] font-bold uppercase tracking-wider text-choco/40">
        {label}
      </span>
      <span className={`truncate ${mono ? "font-mono" : ""}`}>
        {copied ? "kopyalandı" : value}
      </span>
    </button>
  );
}
