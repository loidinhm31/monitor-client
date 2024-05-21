import { nextui } from "@nextui-org/theme";

/** @type {import("tailwindcss").Config} */
module.exports = {
  content: [
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
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
  plugins: [nextui()]
};