import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1d2923",
        forest: "#264c3b",
        leaf: "#537b5b",
        sage: "#e8eee6",
        cream: "#f8f7f2",
        sand: "#efede4",
        muted: "#727a73",
      },
      fontFamily: {
        sans: ["Arial", "Helvetica", "sans-serif"],
        display: ["Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 12px 36px rgba(29, 41, 35, 0.08)",
      },
    },
  },
  plugins: [forms],
};

export default config;
