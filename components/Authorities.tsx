"use client";

import { useCallback, useEffect, useState } from "react";
import { DATA_EVENT, getAuthorities } from "@/lib/api";
import { formatName } from "@/lib/format";

/** Read-only "Yetkililer" list shown in the footer. */
export default function Authorities() {
  const [list, setList] = useState<string[]>([]);

  const read = useCallback(() => {
    getAuthorities().then(setList).catch(() => {});
  }, []);

  useEffect(() => {
    read();
    window.addEventListener("storage", read);
    window.addEventListener(DATA_EVENT, read);
    return () => {
      window.removeEventListener("storage", read);
      window.removeEventListener(DATA_EVENT, read);
    };
  }, [read]);

  if (list.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
      <span className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-teal-deep">
        Yetkililer
      </span>
      {list.map((name) => (
        <span
          key={name}
          className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 font-system text-xs font-semibold text-choco/85"
        >
          {formatName(name)}
        </span>
      ))}
    </div>
  );
}
