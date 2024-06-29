import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./remotion/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        // background: "#FFFFFF",
        // foreground: "#4B5563",
        background: "#000000",
        foreground: "#FFFFFF",
        mediumGray: "#9CA3AF",
      },
    },
  },
  plugins: [],
} satisfies Config;
