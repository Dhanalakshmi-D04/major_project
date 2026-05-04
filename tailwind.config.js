/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "100% 50%" }
        }
      },
      animation: {
        "fade-in-up": "fadeInUp 500ms ease-out both",
        shimmer: "shimmer 2.2s ease-in-out infinite alternate"
      },
      colors: {
        background: "#0f172a",
        card: "#1e293b",
        primary: "#2563eb",
        high: "#ef4444",
        medium: "#facc15",
        low: "#22c55e"
      },
      boxShadow: {
        soft: "0 10px 25px -15px rgba(0,0,0,0.55)",
        glowBlue: "0 0 0 1px rgba(37, 99, 235, 0.25), 0 14px 40px -18px rgba(37, 99, 235, 0.55)",
        glowRed: "0 0 0 1px rgba(239, 68, 68, 0.20), 0 14px 40px -18px rgba(239, 68, 68, 0.55)",
        glowGreen: "0 0 0 1px rgba(34, 197, 94, 0.18), 0 14px 40px -18px rgba(34, 197, 94, 0.45)",
        glass: "0 0 0 1px rgba(255,255,255,0.07), 0 18px 50px -30px rgba(0,0,0,0.75)"
      }
    }
  },
  plugins: []
};

