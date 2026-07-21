import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "Space Grotesk", "system-ui", "sans-serif"],
        system: ["var(--font-system)", "Inter", "system-ui", "sans-serif"],
      },
      maxWidth: {
        wide: "1600px",
      },
      colors: {
        // --- Modern matte (dark) palette ---
        // "choco" tokens now carry TEXT color (light on dark) so existing
        // text-choco/… classes stay readable after the theme flip.
        choco: { light: "#9aa6b4", DEFAULT: "#e8edf4", deep: "#ffffff" },
        cream: "#171c24", // card surface
        paper: "#1c222c",
        sky: { light: "#232b36", DEFAULT: "#141a22", deep: "#0d1117" },
        grass: { light: "#334033", DEFAULT: "#6fae5f", deep: "#9bcf8c" },
        cheese: { light: "#eac36b", DEFAULT: "#d7a441", deep: "#ecc673" },
        teal: { light: "#84dadc", DEFAULT: "#49c0c2", deep: "#74d3d5" },
        cream2: "#20272f",

        // legacy tokens kept, remapped for dark
        abyss: "#080b0f",
        void: "#12171e",
        panel: "#1c222c",
        wood: "#9aa6b4",
        system: {
          blue: "#49c0c2",
          cyan: "#5cc7c9",
          violet: "#9b82f0",
          purple: "#d7a441",
          glow: "#49c0c2",
        },
      },
      boxShadow: {
        card: "0 12px 36px rgba(0,0,0,0.42), 0 2px 8px rgba(0,0,0,0.3)",
        pop: "0 20px 50px rgba(0,0,0,0.55)",
        cheese: "0 8px 22px rgba(215,164,65,0.28)",
        glow: "0 0 0 1px rgba(73,192,194,0.35)",
        "glow-sm": "0 0 0 1px rgba(73,192,194,0.3)",
        "glow-violet": "0 8px 22px rgba(155,130,240,0.28)",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0) translateX(0)" },
          "50%": { transform: "translateY(-8px) translateX(6px)" },
        },
        "system-in": {
          "0%": { opacity: "0", transform: "translateY(10px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
      },
      animation: {
        "pulse-glow": "pulse-glow 2.4s ease-in-out infinite",
        float: "float 4s ease-in-out infinite",
        "float-slow": "float-slow 10s ease-in-out infinite",
        "system-in": "system-in 0.28s ease-out",
        shimmer: "shimmer 6s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
