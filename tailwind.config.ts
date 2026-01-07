import type { Config } from "tailwindcss";
import nexusPreset from "nexus-tailwind-preset";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  presets: [nexusPreset],
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;

