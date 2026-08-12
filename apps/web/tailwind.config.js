/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        paper: "rgb(var(--color-paper) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        sky: {
          DEFAULT: "rgb(var(--color-sky) / <alpha-value>)",
          tint: "rgb(var(--color-sky-tint) / <alpha-value>)",
        },
        berry: {
          DEFAULT: "rgb(var(--color-berry) / <alpha-value>)",
          tint: "rgb(var(--color-berry-tint) / <alpha-value>)",
        },
        gold: {
          DEFAULT: "rgb(var(--color-gold) / <alpha-value>)",
          tint: "rgb(var(--color-gold-tint) / <alpha-value>)",
        },
        mint: {
          DEFAULT: "rgb(var(--color-mint) / <alpha-value>)",
          tint: "rgb(var(--color-mint-tint) / <alpha-value>)",
        },
      },
      fontFamily: {
        // "Display" role — bold headings, big numbers. Not literally a serif;
        // the name is kept so existing font-serif call sites pick it up.
        serif: ["'Plus Jakarta Sans'", "-apple-system", "'Segoe UI'", "'Helvetica Neue'", "Arial", "sans-serif"],
        sans: ["-apple-system", "'Segoe UI'", "Roboto", "'Helvetica Neue'", "Arial", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
