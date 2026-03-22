import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        sand: "#f4efe6",
        ink: "#141414",
        pine: "#123524",
        clay: "#b44c31",
        mist: "#d8e6df"
      },
      boxShadow: {
        card: "0 18px 50px rgba(20, 20, 20, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
