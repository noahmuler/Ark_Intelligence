import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Darker professional purple theme
        purple: {
          950: "#0f0f23", // Very deep purple
          900: "#1e1b4b", // Deep purple
          800: "#2d1b69", // Dark purple
          700: "#4c1d95", // Medium purple
          600: "#6d28d9", // Purple
          500: "#7c3aed", // Light purple
          400: "#8b5cf6", // Lavender
          300: "#a78bfa", // Light lavender
          200: "#c4b5fd", // Very light lavender
          100: "#ddd6fe", // Ultra light lavender
          50: "#ede9fe", // Almost white with purple tint
        },
        // Trading colors updated for theme
        bullish: "#10b981", // Keep green for bullish
        bearish: "#f43f5e", // Keep red for bearish
        alert: "#fbbf24", // Keep amber for alerts
        neutral: "#8b5cf6", // Purple for neutral
        // White variants
        white: {
          50: "#ffffff",
          100: "#fafafa",
          200: "#f5f5f5",
          300: "#f0f0f0",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Consolas", "monospace"],
      },
      animation: {
        "marquee": "marquee 20s linear infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 6s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "slide-up": "slideUp 0.3s ease-out",
        "fade-in": "fadeIn 0.5s ease-out",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 20px rgba(147, 51, 234, 0.5)" },
          "100%": { boxShadow: "0 0 30px rgba(147, 51, 234, 0.8), 0 0 40px rgba(59, 130, 246, 0.6)" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
