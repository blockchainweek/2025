import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    // Event type colors
    "text-blue-400",
    "text-purple-400",
    "text-green-400",
    "text-pink-400",
    "text-yellow-400",
    "text-orange-400",
    "text-gray-400",
    "bg-blue-500/10",
    "bg-purple-500/10",
    "bg-green-500/10",
    "bg-pink-500/10",
    "bg-yellow-500/10",
    "bg-orange-500/10",
    "bg-gray-500/10",
    "border-blue-500/20",
    "border-purple-500/20",
    "border-green-500/20",
    "border-pink-500/20",
    "border-yellow-500/20",
    "border-orange-500/20",
    "border-gray-500/20",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "#e2382a",
          50: "#fef2f2",
          100: "#fde3e2",
          200: "#fbcac7",
          300: "#f7a6a1",
          400: "#f27971",
          500: "#e2382a",
          600: "#cc2820",
          700: "#ab1f1a",
          800: "#8c1c19",
          900: "#741b19",
          950: "#400a09",
        },
        default: "#e2382a",
      },
    },
  },
  plugins: [],
} satisfies Config;
