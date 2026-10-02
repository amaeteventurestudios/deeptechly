import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        deepOrange: "#FF5A00",
        burntOrange: "#E94D00",
        darkOrange: "#C93F00",
        paleOrange: "#FFF1E8",
        paper: "#FAF8F4",
        offWhite: "#F7F3EE",
        ink: "#0E0E0E",
        charcoal: "#262626",
        muted: "#737373",
        line: "#E5E0D8"
      },
      boxShadow: {
        hard: "4px 4px 0 #0f0f0f",
        hardLg: "8px 8px 0 #0f0f0f",
        orange: "4px 4px 0 #ff5a00"
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Arial", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"]
      }
    }
  },
  plugins: []
};

export default config;
