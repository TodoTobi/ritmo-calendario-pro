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
        // Family Style Reference Tokens (DESIGN (4).md)
        family: {
          cream: '#fbfaf9', // Cream Canvas: warm paper off-white
          stone: '#f2f0ed', // Stone Surface: card surfaces & inset hairline tone
          sand: '#f6f4ef', // Sand: secondary pill CTA
          ink: '#121212', // Ink Black: primary action fill & headings
          charcoal: '#343433', // Heading Charcoal: primary text
          brown: '#474645', // Body Brown: body copy
          muted: '#7e7e7d', // Muted Gray: helper text & inactive nav
          border: '#e5d5c3', // Stone Border: hairline decorative borders
          blue: '#0086fc', // Link Blue: actionable links & feature text
          sky: '#64c6ff', // Sky Blue: illustration fill
          green: '#00c978', // Grass Green: supporting accent
          mint: '#00ca48', // Mint: positive highlight wash
          orange: '#ff3e00', // Ember Orange: signature brand accent & demo links
          yellow: '#ffcd6c', // Sun Yellow: illustration fill
          gold: '#d48f00', // Gold
          honey: '#ffbb26', // Honey
          pink: '#ff58ae', // Coral Pink
          violet: '#9f4fff', // Plum Violet
          red: '#ff2b3a', // Alert Red: attention/error
        },
        // Backward-compatible semantic tokens mapped to Family palette
        ritmo: {
          purple: {
            DEFAULT: '#121212', // Ink Black primary action
            soft: '#f2f0ed',
          },
          red: {
            DEFAULT: '#ff2b3a', // Alert Red
            soft: '#ffebee',
          },
          orange: {
            DEFAULT: '#ff3e00', // Ember Orange
            soft: '#fff0eb',
          },
          blue: {
            DEFAULT: '#0086fc', // Link Blue
            soft: '#edf6ff',
          },
          green: {
            DEFAULT: '#00c978', // Grass Green
            soft: '#eefdf4',
          },
          yellow: {
            DEFAULT: '#ffbb26', // Honey
            soft: '#fff9e8',
          },
          bg: '#fbfaf9', // Cream Canvas
          panel: '#ffffff', // Pure White with hairline border
          ink: '#121212', // Ink Black
          muted: '#7e7e7d', // Muted Gray
          line: '#f2f0ed', // Stone Surface hairline
          soft: '#f6f4ef', // Sand
        },
      },
      fontFamily: {
        inter: ['var(--font-inter)', 'sans-serif'],
        sans: ['var(--font-inter)', 'sans-serif'],
        manrope: ['var(--font-inter)', 'sans-serif'],
      },
      borderRadius: {
        'family-card': '10px',
        'family-button': '32px',
        'family-pill': '9999px',
        'family-badge': '6px',
        'ritmo-card': '10px',
        'ritmo-button': '32px',
        'ritmo-pill': '9999px',
      },
      boxShadow: {
        'family-inset': 'inset 0 0 0 1px #f2f0ed',
        'family-dark': '0 0 24px 0 rgba(0, 0, 0, 0.15)',
        'family-subtle': '0 1px 6px 0 rgba(0, 0, 0, 0.04), 0 0 24px 0 rgba(0, 0, 0, 0.05)',
        'ritmo-card': 'inset 0 0 0 1px #f2f0ed',
        'ritmo-soft': '0 1px 6px 0 rgba(0, 0, 0, 0.04)',
        'ritmo-modal': '0 0 24px 0 rgba(0, 0, 0, 0.15)',
        none: 'none',
      },
    },
  },
  plugins: [],
};

export default config;
