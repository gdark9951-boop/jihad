/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ألوان مستوحاة من Google
        primary: {
          50: '#E8F0FE',
          100: '#D2E3FC',
          200: '#AECBFA',
          300: '#8AB4F8',
          400: '#669DF6',
          500: '#4285F4', // اللون الأساسي
          600: '#1A73E8',
          700: '#1967D2',
          800: '#185ABC',
          900: '#174EA6',
        },
        medad: {
          ink: '#1F1F1F',        // لون الحبر
          paper: '#FAFAFA',      // لون الورق
          border: '#E0E0E0',     // الحدود
          hover: '#F5F5F5',      // التحويم
        },
        dark: {
          bg: '#0F172A',         // خلفية داكنة
          card: '#1E293B',       // بطاقات داكنة
          border: '#334155',     // حدود داكنة
          hover: '#334155',      // تحويم داكن
          text: '#F1F5F9',       // نص فاتح
          muted: '#94A3B8',      // نص خافت
        }
      },
      fontFamily: {
        arabic: ['Tajawal', 'IBM Plex Sans Arabic', 'sans-serif'],
      },
      boxShadow: {
        'google': '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)',
        'google-lg': '0 1px 3px 0 rgba(60,64,67,.3), 0 4px 8px 3px rgba(60,64,67,.15)',
        'dark': '0 1px 3px 0 rgba(0,0,0,.5), 0 4px 8px 3px rgba(0,0,0,.3)',
      },
      borderRadius: {
        'google': '8px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [],
}
