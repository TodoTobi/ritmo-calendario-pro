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
        // Duolingo Style Reference Tokens (DESIGN (3).md)
        duo: {
          green: '#58cc02', // Eager Green
          'green-light': '#d7ffb8', // Storybook Green
          'green-leaf': '#a5ed6e', // Fresh Leaf
          blue: '#1cb0f6', // Spark Blue
          ink: '#000437', // Night Ink
          white: '#ffffff', // Paper White
          charcoal: '#4b4b4b', // Charcoal (Headings & workhorse text)
          gray: '#777777', // Pencil Gray (Body copy & secondary)
          'gray-faded': '#afafaf', // Faded Gray (Borders & low-emphasis)
          'border-light': '#e5e5e5', // Light divider border
        },
        // Backward-compatible semantic tokens mapped to Duolingo palette
        ritmo: {
          purple: {
            DEFAULT: '#58cc02', // Eager Green primary
            soft: '#d7ffb8',
          },
          red: {
            DEFAULT: '#ff4b4b', // Duolingo warning/alert red
            soft: '#ffebee',
          },
          orange: {
            DEFAULT: '#ff9600', // Duolingo orange / streak
            soft: '#fff4e5',
          },
          blue: {
            DEFAULT: '#1cb0f6', // Spark Blue
            soft: '#ddf4ff',
          },
          green: {
            DEFAULT: '#58cc02', // Eager Green
            soft: '#d7ffb8',
          },
          yellow: {
            DEFAULT: '#ffc800', // Duolingo gold/gem
            soft: '#fff9db',
          },
          bg: '#ffffff', // Paper White
          panel: '#ffffff', // White cards with 2px borders
          ink: '#4b4b4b', // Charcoal
          muted: '#777777', // Pencil Gray
          line: '#e5e5e5', // Border line
          soft: '#f7f7f7', // Light neutral wash
        },
      },
      fontFamily: {
        nunito: ['var(--font-nunito)', 'sans-serif'],
        sans: ['var(--font-nunito)', 'sans-serif'],
        feather: ['var(--font-nunito)', 'sans-serif'],
        inter: ['var(--font-nunito)', 'sans-serif'],
        manrope: ['var(--font-nunito)', 'sans-serif'],
      },
      borderRadius: {
        'duo-button': '12px',
        'duo-card': '16px',
        'duo-pill': '9999px',
        'ritmo-card': '16px',
        'ritmo-button': '12px',
        'ritmo-pill': '9999px',
      },
      boxShadow: {
        'duo-sticker': '0 2px 0 0 #afafaf',
        'duo-green': '0 4px 0 0 #46a302',
        'duo-blue': '0 4px 0 0 #1899d6',
        'duo-white': '0 2px 0 0 #e5e5e5',
        none: 'none',
      },
    },
  },
  plugins: [],
};

export default config;
