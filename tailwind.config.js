/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: v('bg'),
        surface: v('surface'),
        raised: v('raised'),
        line: v('line'),
        ink: v('ink'),
        muted: v('muted'),
        faint: v('faint'),
        primary: v('primary'),
        'primary-strong': v('primary-strong'),
        success: v('success'),
        danger: v('danger'),
        warning: v('warning'),
        info: v('info'),
      },
      fontFamily: {
        display: ['"Barlow Condensed"', 'system-ui', 'sans-serif'],
        sans: ['Barlow', 'system-ui', 'sans-serif'],
      },
      borderRadius: { xl: '14px', '2xl': '20px' },
      boxShadow: {
        card: '0 1px 0 rgb(255 255 255 / 0.04) inset, 0 8px 24px -12px rgb(0 0 0 / 0.6)',
        glow: '0 10px 30px -10px rgb(var(--primary) / 0.55)',
      },
      keyframes: {
        'fade-up': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'none' } },
        'scale-in': { from: { opacity: 0, transform: 'scale(.96)' }, to: { opacity: 1, transform: 'none' } },
        'slide-up': { from: { transform: 'translateY(100%)' }, to: { transform: 'none' } },
        pop: { '0%': { transform: 'scale(1)' }, '40%': { transform: 'scale(1.15)' }, '100%': { transform: 'scale(1)' } },
        confetti: { '0%': { transform: 'translateY(-20px) rotate(0deg)', opacity: 1 }, '100%': { transform: 'translateY(280px) rotate(540deg)', opacity: 0 } },
        'pop-in': { '0%': { opacity: 0, transform: 'translateY(-16px) scale(.92)' }, '60%': { opacity: 1, transform: 'translateY(2px) scale(1.02)' }, '100%': { transform: 'none' } },
      },
      animation: {
        'fade-up': 'fade-up .35s cubic-bezier(.2,.8,.2,1) both',
        'scale-in': 'scale-in .2s cubic-bezier(.2,.8,.2,1) both',
        'slide-up': 'slide-up .28s cubic-bezier(.2,.8,.2,1) both',
        pop: 'pop .3s ease-out',
        confetti: 'confetti 1.8s cubic-bezier(.2,.6,.4,1) both',
        'pop-in': 'pop-in .45s cubic-bezier(.2,.8,.2,1) both',
      },
    },
  },
  plugins: [],
}
