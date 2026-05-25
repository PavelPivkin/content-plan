import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";
import daisyui from "daisyui";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: [typography, daisyui],
  daisyui: {
    themes: [
      {
        contentlab: {
          primary: "#0f4c81",
          secondary: "#0f766e",
          accent: "#b7791f",
          neutral: "#172033",
          "base-100": "#f6f3ee",
          "base-200": "#ebe5dc",
          "base-300": "#d7cfc2",
          info: "#2563eb",
          success: "#15803d",
          warning: "#b7791f",
          error: "#b42318"
        }
      }
    ]
  }
};

export default config;
