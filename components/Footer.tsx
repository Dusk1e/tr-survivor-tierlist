import Authorities from "./Authorities";

export default function Footer() {
  return (
    <footer className="mx-auto mt-8 w-full max-w-wide px-5 pb-12 sm:px-8">
      <div className="hairline mb-6" />

      <div className="mb-5">
        <Authorities />
      </div>

      {/* Yapımcılar */}
      <div className="mb-5 text-center">
        <p className="font-system text-[11px] font-semibold uppercase tracking-[0.22em] text-choco/35">
          Tasarım ve Yapım
        </p>
        <p className="mt-1.5 font-display text-lg font-bold tracking-tight sm:text-xl">
          <span
            style={{
              color: "#f3cf7e",
              textShadow: "0 0 16px rgba(232,182,76,0.45)",
            }}
          >
            Alwesh
          </span>
          <span className="mx-2 text-choco/30">&amp;</span>
          <span
            style={{
              color: "#8ad2f2",
              textShadow: "0 0 16px rgba(79,179,224,0.45)",
            }}
          >
            Blacklean
          </span>
        </p>
        <p className="mt-1.5 font-system text-xs font-medium text-choco/45">
          Bu tierlist, TR Survivor topluluğuna gönül verenler tarafından
          hazırlandı.
        </p>
      </div>

      <div className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
        <p className="font-system text-xs text-choco/55">
          <span className="font-display font-bold text-choco/80">
            TR - SURVİVOR TİERLİST
          </span>{" "}
          - Atelier 801 ile bağlantılı değildir.
        </p>
      </div>
    </footer>
  );
}
