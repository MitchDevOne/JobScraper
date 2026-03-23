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
        sand: "#eef2ff",
        ink: "#0f172a",
        pine: "#4338ca",
        clay: "#6366f1",
        mist: "#e0e7ff"
      },
      boxShadow: {
        card: "0 24px 60px rgba(79, 70, 229, 0.16)"
      }
    }
  },
  plugins: []
};

export default config;
