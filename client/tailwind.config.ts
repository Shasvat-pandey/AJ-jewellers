import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-burgundy': '#4A0E1B',
        'brand-gold': '#D4AF37',
        'brand-light': '#FDFBF7',
        maroon: {
          DEFAULT: "#3B0E17", // base background
          deep: "#2A0A10",    // hallmark strip / darkest overlay
        },
        gold: "#C9A24B",
        ivory: "#F3E9D8",
        rose: "#E7C9B8",
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'serif'],
        sans: ['"Cormorant Garamond"', 'serif'],
        cormorant: ['"Cormorant Garamond"', "serif"],
        jost: ['"Cormorant Garamond"', "serif"],
      }
    },
  },
  plugins: [],
} satisfies Config