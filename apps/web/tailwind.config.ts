import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        mutedSurface: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        deepOrange: "hsl(var(--deep-orange))",
        burntOrange: "hsl(var(--burnt-orange))",
        darkOrange: "hsl(var(--dark-orange))",
        paleOrange: "hsl(var(--pale-orange))",
        paper: "hsl(var(--paper))",
        offWhite: "hsl(var(--off-white))",
        ink: "hsl(var(--ink))",
        charcoal: "hsl(var(--charcoal))",
        muted: "hsl(var(--muted-foreground))",
        line: "hsl(var(--line))"
      },
      boxShadow: {
        hard: "var(--shadow-hard)",
        hardLg: "var(--shadow-hard-lg)",
        orange: "var(--shadow-orange)"
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
