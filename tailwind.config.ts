import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      spacing: {
        '4.5': '1.125rem', // 18px
        '5.5': '1.375rem', // 22px
        '6.5': '1.625rem', // 26px
        '13': '3.25rem',   // 52px
        '68': '17rem',     // 272px
        '84': '21rem',     // 336px
      },
    },
  },
  plugins: [],
};
export default config;
