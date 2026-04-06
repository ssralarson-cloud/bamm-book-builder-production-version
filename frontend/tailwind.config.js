/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        'kdp-success': 'oklch(var(--kdp-success))',
        'kdp-bleed': 'oklch(var(--kdp-bleed))',
        'kdp-trim': 'oklch(var(--kdp-trim))',
        'kdp-safe': 'oklch(var(--kdp-safe))',
        'safe-bleed': 'oklch(var(--safe-bleed))',
        'safe-trim': 'oklch(var(--safe-trim))',
        'safe-grid': 'oklch(var(--safe-grid))',
        'forest-brown': 'var(--forest-brown)',
        'forest-dark': 'var(--forest-dark)',
        'forest-light': 'var(--forest-light)',
        'parchment': 'var(--parchment)',
        'parchment-dark': 'var(--parchment-dark)',
        'boho-brown': 'var(--boho-brown)',
        'boho-cream': 'var(--boho-cream)',
        'boho-ornament': 'var(--boho-ornament)',
        'boho-accent': 'var(--boho-accent)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        serif: ['Crimson Text', 'Georgia', 'serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        'boho': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'boho-lg': '0 4px 16px rgba(0, 0, 0, 0.12)',
        'forest': '0 2px 8px rgba(0, 0, 0, 0.15)',
        'forest-lg': '0 4px 16px rgba(0, 0, 0, 0.2)',
      },
      spacing: {
        'elegant-xs': 'var(--spacing-xs)',
        'elegant-sm': 'var(--spacing-sm)',
        'elegant-md': 'var(--spacing-md)',
        'elegant-lg': 'var(--spacing-lg)',
        'elegant-xl': 'var(--spacing-xl)',
        'elegant-2xl': 'var(--spacing-2xl)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
}
