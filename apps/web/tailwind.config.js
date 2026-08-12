/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#241f21",
        paper: "#fffdfb",
        coral: { DEFAULT: "#ff6b57", tint: "#ffece7" },
        violet: { DEFAULT: "#7c6ff0", tint: "#edebfd" },
        gold: { DEFAULT: "#ffb238", tint: "#fff4de" },
        mint: { DEFAULT: "#2fa87a", tint: "#e6f6ee" },
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
