import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ritmo: {
          purple: {
            DEFAULT: '#6558f5',
            soft: '#eeedff',
          },
          red: {
            DEFAULT: '#ff5d63',
            soft: '#fff0f1',
          },
          orange: {
            DEFAULT: '#f2a641',
            soft: '#fff5e6',
          },
          blue: {
            DEFAULT: '#4c9af5',
            soft: '#edf6ff',
          },
          green: {
            DEFAULT: '#46a978',
            soft: '#edf9f3',
          },
          yellow: {
            DEFAULT: '#e7c94a',
            soft: '#fffbea',
          },
          bg: '#f5f6f8',
          panel: '#ffffff',
          ink: '#151719',
          muted: '#7b8188',
          line: '#e9ebef',
          soft: '#f7f8fa',
        },
      },
      fontFamily: {
        manrope: ['var(--font-manrope)', 'sans-serif'],
        sans: ['var(--font-dm-sans)', 'sans-serif'],
      },
      borderRadius: {
        'ritmo-card': '18px',
        'ritmo-button': '12px',
        'ritmo-pill': '8px',
      },
      boxShadow: {
        'ritmo-card': '0 18px 50px rgba(28, 31, 36, 0.07)',
        'ritmo-soft': '0 8px 22px rgba(28, 31, 36, 0.05)',
        'ritmo-modal': '0 30px 100px rgba(0, 0, 0, 0.18)',
      },
    },
  },
  plugins: [],
};

export default config;
