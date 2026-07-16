/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#0b1730",
          900: "#0f1e3d",
          800: "#152a52",
          700: "#1c3566",
        },
        brand: {
          50: "#fdecec",
          100: "#f9d0d0",
          500: "#c81e2c",
          600: "#b01925",
          700: "#8f141e",
        },
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(15, 30, 61, 0.06), 0 1px 3px 0 rgba(15, 30, 61, 0.08)",
      },
      borderRadius: {
        xl2: "1rem",
      },
    },
  },
  plugins: [],
};
