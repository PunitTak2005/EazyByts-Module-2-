/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7fa',
          100: '#e4ecf5',
          200: '#cddceb',
          300: '#a7c2dd',
          400: '#7ba1cb',
          500: '#3b82f6', // bright vivid accent blue
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Stock charts standard colors
        up: {
          500: '#10b981', // green for gains
          600: '#059669',
        },
        down: {
          500: '#ef4444', // red for losses
          600: '#dc2626',
        },
        dark: {
          bg: '#0b0f19', // deep dark theme base
          card: '#161c2a', // glass card background base
          border: '#243048', // subtle dark divider
          text: '#f3f4f6',
          muted: '#9ca3af'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },

      // ─── Layering system ─────────────────────────────────────────────────
      // Named z-index tokens.  Assign these semantically — never use raw numbers.
      //
      //  Layer          Token              z-index   Tailwind class
      //  ─────────────────────────────────────────────────────────────
      //  Page content   z-content          1         z-content
      //  Ticker bar     z-ticker           30        z-ticker
      //  Sticky navbar  z-navbar           40        z-navbar
      //  Dropdowns      z-dropdown         50        z-dropdown
      //  Tooltips       z-tooltip          60        z-tooltip
      //  Modals         z-modal            70        z-modal
      //  Toasts         z-toast            80        z-toast
      //
      // Notes:
      //  • The Navbar is at z-navbar (40), above the ticker (30).
      //    Dropdowns inside the Navbar (z-dropdown = 50) paint in the Navbar's
      //    stacking context, which already beats the ticker's stacking context.
      //  • Tooltips and modals use position:fixed, so their z-index is always
      //    relative to the root stacking context — they reliably float above all.
      zIndex: {
        content:  '1',
        ticker:   '30',
        navbar:   '40',
        dropdown: '50',
        tooltip:  '60',
        modal:    '70',
        toast:    '80',
      },

      // ─── Ticker animation registered here so JIT never purges it ───────
      keyframes: {
        'tv-ticker': {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'ticker-scroll': {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        // These are referenced by name in CSS/inline styles — Tailwind generates the class
        'tv-ticker':      'tv-ticker var(--ticker-dur, 30s) linear infinite',
        'ticker-scroll':  'ticker-scroll var(--ticker-dur, 35s) linear infinite',
      },
    },
  },
  // Safelist ensures the class is never purged even if not found in content scan
  safelist: [
    'animate-tv-ticker',
    'animate-ticker-scroll',
    // Z-index design tokens
    'z-content',
    'z-ticker',
    'z-navbar',
    'z-dropdown',
    'z-tooltip',
    'z-modal',
    'z-toast',
  ],
  plugins: [],
}


