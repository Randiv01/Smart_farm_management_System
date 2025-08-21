/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "light-beige": "#f7e9cb", // 60%
        "dark-green": "#2e7d32",  // 30%
        "soft-white": "#ffffff",   // 10%
        "dark-bg": "#111827",
        "dark-card": "#1f2937",
        "dark-text": "#f9fafb",
        "dark-gray": "#374151",
        // Additional button-specific colors
        "btn-blue": "#2563eb",       // download / export / info actions
        "btn-teal": "#059669",       // add another / accent actions
        "btn-red": "#ef4444",        // cancel / delete / error
        "btn-yellow": "#fbbf24",     // warning / optional actions
        "btn-gray": "#6b7280",       // neutral secondary


      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        card: "0 8px 24px rgba(0,0,0,0.05)",
        cardDark: "0 8px 24px rgba(0,0,0,0.2)",
        btn: "0 4px 12px rgba(16,185,129,0.3)",
      },
      keyframes: {
        spin: { to: { transform: "rotate(360deg)" } },
        popIn: { "0%": { transform: "scale(0.7)", opacity: "0" }, "100%": { transform: "scale(1)", opacity: "1" } },
        checkGrow: { "0%": { transform: "scale(0)" }, "100%": { transform: "scale(1)" } },
      },
      animation: {
        spin: "spin 1s linear infinite",
        popIn: "popIn 0.4s ease forwards",
        checkGrow: "checkGrow 0.4s ease forwards",
      },
    },
  },
  plugins: [],
  darkMode: "class",
};
