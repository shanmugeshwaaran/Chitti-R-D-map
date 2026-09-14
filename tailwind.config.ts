import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Chitti Map navy/blue brand scale
        navy: {
          950: "#050B18",
          900: "#0A1428",
          800: "#0F1C38",
          700: "#162B52",
          600: "#1F3B6E",
        },
        chitti: {
          blue: "#3B7BF6",
          cyan: "#35D1E0",
          red: "#FF5A5F",
          amber: "#FBBF24",
          green: "#34D399",
          ink: "#F3F6FD",
          mist: "#A9B7D6",
        },
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(53, 209, 224, 0.15), 0 8px 40px -8px rgba(59, 123, 246, 0.45)",
        sheet: "0 -8px 40px -8px rgba(5, 11, 24, 0.55)",
      },
      backgroundImage: {
        "chitti-gradient":
          "linear-gradient(160deg, #0A1428 0%, #0F1C38 45%, #162B52 100%)",
        "chitti-radial":
          "radial-gradient(circle at 15% 0%, rgba(53, 209, 224, 0.25), transparent 45%)",
      },
    },
  },
  plugins: [],
};

export default config;
