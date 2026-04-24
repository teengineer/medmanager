import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#E30A17",
          dark: "#B0060F",
          light: "#FEE7E9",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
