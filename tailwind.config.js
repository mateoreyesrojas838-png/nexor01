/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        jd: {
          cyan: {
            50: '#FFF9E6',
            100: '#FFE566',
            200: '#FFD700',
            300: '#FBBF24',
            400: '#F59E0B',
          },
          blue: {
            50: '#FDE68A',
            100: '#FCD34D',
            200: '#FBBF24',
            300: '#F59E0B',
            400: '#D97706',
            500: '#B45309',
            600: '#A04808',
            700: '#8C3D07',
            800: '#783206',
            900: '#642705',
          },
          violet: {
            50: '#FFE566',
            100: '#FFD700',
            200: '#FBBF24',
            300: '#F59E0B',
            400: '#D97706',
          },
          magenta: {
            50: '#FFF9E6',
            100: '#FFE566',
            200: '#FFD700',
            300: '#FBBF24',
            400: '#F59E0B',
            500: '#D97706',
            600: '#B45309',
            700: '#92400E',
            800: '#78350F',
            900: '#5C2A0D',
          }
        },
        ai: {
          blue: '#FFD700',
          violet: '#D97706',
          magenta: '#FFB800',
          purple: '#0F0820',
          dark: '#140A2E',
        },
        premium: {
          bg: '#0F051E',
          sidebar: '#140826',
          purple: '#B45309',
          glow: '#FFD700',
          glass: 'rgba(255, 255, 255, 0.03)',
        },
        action: {
          start: '#D97706',
          end: '#FFD700',
        },
        vibrant: {
          cyan: '#FFD700',
          blue: '#F59E0B',
          purple: '#D97706',
          magenta: '#FBBF24',
          pink: '#FFE566',
        },
        neon: {
          blue: '#FFD700',
          purple: '#FBBF24',
          pink: '#FFB800',
          green: '#00FF9D',
        },
        dark: {
          50: '#E4E4E7',
          100: '#D4D4D8',
          200: '#A1A1AA',
          300: '#71717A',
          400: '#52525B',
          500: '#3F3F46',
          600: '#27272A',
          700: '#18181B',
          800: '#09090B',
          900: '#000000',
          950: '#050505',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-liquid': 'linear-gradient(135deg, #D97706 0%, #F59E0B 40%, #FFD700 100%)',
        'gradient-ai-mesh': 'radial-gradient(circle at 20% 30%, rgba(255, 215, 0, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(255, 184, 0, 0.15) 0%, transparent 50%)',
        'gradient-premium': 'radial-gradient(circle at center, #251052 0%, #0F051E 100%)',
        'gradient-glow': 'radial-gradient(circle at center, rgba(212, 160, 0, 0.3) 0%, rgba(0, 0, 0, 0) 70%)',
      },
      boxShadow: {
        'liquid-glass': '0 20px 50px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
        'ai-glow': '0 0 30px rgba(255, 215, 0, 0.4)',
        'premium-purple': '0 0 20px rgba(212, 160, 0, 0.4)',
        'card': '0 12px 48px 0 rgba(0, 0, 0, 0.6)',
        'water-shadow': '0 25px 60px rgba(0,0,0,0.5)',
        'water-glow': '0 45px 100px rgba(212,160,0,0.25)',
        'btn-liquid': '0 0 60px rgba(255,215,0,0.5)',
        'btn-outline': '0 0 30px rgba(251,191,36,0.3)',
      },
      animation: {
        'carousel': 'carousel 16s infinite steps(5, end)',
        'mesh-flow': 'mesh 15s ease infinite alternate',
        'liquid-float': 'float 8s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        carousel: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-80%)' },
        },
        mesh: {
          '0%': { 'background-position': '0% 0%' },
          '100%': { 'background-position': '100% 100%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-15px)' },
        },
      },
    },
  },
  plugins: [],
}
