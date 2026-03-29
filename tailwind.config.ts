import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b0f1a",
        mist: "#f3f4f6",
        accent: "#3b82f6",
        ember: "#f97316",
        // Design doc palette
        "ide-bg": "#0e1117",
        "ide-surface": "#161b22",
        "ide-surface-alt": "#1c2230",
        "ide-border": "#2a3142",
        "ide-text": "#e6edf3",
        "ide-text-secondary": "#7d8590",
        "ide-text-tertiary": "#484f58",
        "accent-blue": "#3b82f6",
        "accent-purple": "#a371f7",
        "accent-green": "#3fb950",
        "accent-orange": "#d29922",
        "accent-red": "#f85149",
        "accent-cyan": "#58a6ff",
        "accent-pink": "#f778ba",
      },
      fontFamily: {
        display: ["DM Sans", "system-ui", "sans-serif"],
        body: ["DM Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
