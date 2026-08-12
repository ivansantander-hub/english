/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // A language-learner's passport: navy cover, warm paper pages,
        // postcard-stamp red, gold foil for achievements.
        ink: {
          DEFAULT: "#1B2A4A",
          light: "#2E4470",
        },
        paper: "#FBF7EE",
        stamp: "#D64545",
        gold: "#D9A441",
      },
      fontFamily: {
        serif: ["Fraunces", "Georgia", "Cambria", "'Times New Roman'", "Times", "serif"],
        sans: [
          "'IBM Plex Sans'",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        mono: [
          "'IBM Plex Mono'",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};
