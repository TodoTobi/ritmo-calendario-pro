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
        // Caldera Design System Tokens
        caldera: {
          ember: '#fc5000',
          'ember-hover': '#e04700',
          plasma: '#524ae9',
          sulfur: '#f5f28e',
          limestone: '#f7f6f2',
          pumice: '#e2e2df',
          obsidian: '#070607',
          chalk: '#ffffff',
          muted: '#6e6d69',
          line: '#d5d4cf',
          soft: '#ecebe7',
        },
        // Mapped ritmo namespace for backwards compatibility with Caldera palette
        ritmo: {
          purple: {
            DEFAULT: '#fc5000', // Caldera Ember acts as primary accent
            soft: '#fff1eb',
          },
          red: {
            DEFAULT: '#fc5000', // Ember
            soft: '#ffebe5',
          },
          orange: {
            DEFAULT: '#fc5000',
            soft: '#fff2ec',
          },
          blue: {
            DEFAULT: '#524ae9', // Plasma Violet
            soft: '#f0effe',
          },
          green: {
            DEFAULT: '#2f855a',
            soft: '#edf9f3',
          },
          yellow: {
            DEFAULT: '#f5f28e', // Sulfur
            soft: '#fefee6',
          },
          bg: '#e2e2df', // Pumice canvas
          panel: '#f7f6f2', // Limestone surface
          ink: '#070607', // Obsidian primary text
          muted: '#6e6d69',
          line: '#d5d4cf',
          soft: '#ecebe7',
        },
      },
      fontFamily: {
        display: ['var(--font-bebas-neue)', 'Anton', 'sans-serif'],
        manrope: ['var(--font-bebas-neue)', 'Anton', 'sans-serif'],
        sans: ['var(--font-dm-sans)', 'sans-serif'],
      },
      borderRadius: {
        'ritmo-card': '40px',
        'ritmo-button': '800px',
        'ritmo-pill': '800px',
        'caldera-card': '40px',
        'caldera-pill': '800px',
        'caldera-input': '100px',
      },
      boxShadow: {
        none: 'none',
        'ritmo-card': 'none',
        'ritmo-soft': 'none',
        'ritmo-modal': 'none',
      },
    },
  },
  plugins: [],
};

export default config;
