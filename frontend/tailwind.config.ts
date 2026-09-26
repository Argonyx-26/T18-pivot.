import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: "#06090e",
          card: "#0d131f",
          border: "#1d293d",
          accent: "#00f0ff",
          danger: "#ff003c",
          warning: "#ffb703",
          success: "#00ff66",
        },
      },
    },
  },
  plugins: [],
};

export default config;