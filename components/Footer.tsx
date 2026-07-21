import Authorities from "./Authorities";

export default function Footer() {
  return (
    <footer className="mx-auto mt-8 w-full max-w-wide px-5 pb-12 sm:px-8">
      <div className="hairline mb-6" />

      <div className="mb-5">
        <Authorities />
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
