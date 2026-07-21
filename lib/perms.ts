import { PermId, Session } from "./types";

/** All grantable staff permissions, with Turkish labels for the UI. */
export const PERMS: { id: PermId; label: string; desc: string }[] = [
  { id: "tier_edit", label: "Tierlist Düzenleme", desc: "Fareleri tier'lar arasında taşıyabilir, profil düzenleyebilir." },
  { id: "pw_view", label: "Şifreleri Görme", desc: "Oyuncuların giriş şifrelerini görebilir." },
  { id: "pw_edit", label: "Şifre Düzenleme", desc: "Oyuncuların şifrelerini değiştirebilir." },
  { id: "mouse_add", label: "Yeni Oyuncu Ekleme", desc: "Tierlist'e yeni fare ekleyebilir." },
  { id: "vote_approve", label: "Puan Onayı", desc: "Bekleyen puanlamaları onaylayıp reddedebilir." },
  { id: "vote_log", label: "Puan Logu", desc: "Tüm puanlama kayıtlarını görebilir." },
];

export const PERM_IDS: PermId[] = PERMS.map((p) => p.id);

export function hasPerm(session: Session | null, perm: PermId): boolean {
  return !!session?.permissions?.includes(perm);
}

export function hasAnyPerm(session: Session | null): boolean {
  return (session?.permissions?.length ?? 0) > 0;
}

export function sanitizePerms(raw: any): PermId[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((p): p is PermId => PERM_IDS.includes(p));
}
