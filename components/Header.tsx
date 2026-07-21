"use client";

import { motion } from "framer-motion";

/**
 * Epic glowing masthead. `right` lets pages drop in their own action
 * (e.g. an "Admin" link on the public page, or "Logout" on the dashboard).
 */
export default function Header({
  subtitle = "Transformice · Survivor Topluluğu Sıralama Sistemi",
  right,
}: {
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="relative z-20 mx-auto w-full max-w-wide px-5 pt-8 sm:px-8 sm:pt-12">
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-between">
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-4 sm:gap-5"
        >
          <div>
            <h1 className="logo-text font-display text-3xl font-bold uppercase leading-[0.95] tracking-tight sm:text-5xl">
              TR — SURVİVOR
              <br className="hidden sm:block" /> TİERLİST
            </h1>
            <p className="mt-2 font-system text-[11px] font-semibold uppercase tracking-[0.3em] text-choco/60 sm:text-xs">
              {subtitle}
            </p>
          </div>
        </motion.div>

        <div className="flex items-center gap-2">{right}</div>
      </div>

      <div className="mt-7 hairline" />
    </header>
  );
}
