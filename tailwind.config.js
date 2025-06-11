import { heroui } from "@heroui/react";

/** @type {import("tailwindcss").Config} */
module.exports = {
  content: [
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  themes: {
    light: {
      colors: {
        primary: "#0072f5"
      }
    },
    dark: {
      colors: {
        primary: "#0072f5"
      }
    }
  },
  darkMode: "class",
  plugins: [heroui()]
};