import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    // Industrial Brutalist / Tactical Telemetry design system
    borderRadius: {
      none: '0',
      DEFAULT: '0',
    },
    extend: {
      colors: {
        // Core terminal palette
        terminal: {
          black: '#050505',
          DEFAULT: '#050505',
        },
        phosphor: {
          DEFAULT: '#33FF33',
          dim: 'rgba(51,255,51,0.6)',
          faint: 'rgba(51,255,51,0.2)',
          glow: 'rgba(51,255,51,0.08)',
        },
        vermilion: {
          DEFAULT: '#FF4B2B',
          dim: 'rgba(255,75,43,0.2)',
        },
        cyan: {
          data: '#00FFFF',
          dim: 'rgba(0,255,255,0.6)',
        },
        amber: {
          warn: '#FFB000',
          dim: 'rgba(255,176,0,0.2)',
        },
        // shadcn/ui CSS variable tokens (mapped to design system)
        border: 'rgba(51,255,51,0.2)',
        input: 'rgba(51,255,51,0.15)',
        ring: '#33FF33',
        background: '#050505',
        foreground: '#EAEAEA',
        primary: {
          DEFAULT: '#33FF33',
          foreground: '#050505',
        },
        secondary: {
          DEFAULT: 'rgba(51,255,51,0.08)',
          foreground: '#33FF33',
        },
        destructive: {
          DEFAULT: '#FF4B2B',
          foreground: '#EAEAEA',
        },
        muted: {
          DEFAULT: 'rgba(255,255,255,0.06)',
          foreground: 'rgba(255,255,255,0.45)',
        },
        accent: {
          DEFAULT: 'rgba(51,255,51,0.12)',
          foreground: '#33FF33',
        },
        popover: {
          DEFAULT: '#0A0A0A',
          foreground: '#EAEAEA',
        },
        card: {
          DEFAULT: '#0A0A0A',
          foreground: '#EAEAEA',
        },
      },
      fontFamily: {
        // UI labels, navigation, headers
        sans: ['var(--font-geist-sans)', 'Inter', 'system-ui', 'sans-serif'],
        // ALL telemetry data, IDs, timestamps, manifests
        mono: ['var(--font-ibm-plex-mono)', 'IBM Plex Mono', 'JetBrains Mono', 'monospace'],
      },
      fontSize: {
        // Micro-typography for telemetry labels
        telemetry: ['0.625rem', { lineHeight: '1.2', letterSpacing: '0.1em' }],
        // Standard micro data
        micro: ['0.6875rem', { lineHeight: '1.3', letterSpacing: '0.08em' }],
      },
      letterSpacing: {
        // Tight tracking for macro headers
        tightest: '-0.05em',
        // Generous tracking for telemetry labels
        terminal: '0.1em',
      },
      backgroundImage: {
        // CRT scanline overlay — repeating horizontal scan bands
        scanlines:
          'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
        // Noise/grain texture for mechanical feel
        noise: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
      spacing: {
        // 8px grid — explicit tokens for snap-to-grid discipline
        '18': '4.5rem',
        '22': '5.5rem',
      },
      keyframes: {
        // Phosphor pulse for critical alerts
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        // CRT flicker
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.97' },
          '25%, 75%': { opacity: '0.99' },
        },
        // Alert attention pulse (GSAP handles the complex version)
        alert: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255,75,43,0)' },
          '50%': { boxShadow: '0 0 12px 4px rgba(255,75,43,0.4)' },
        },
      },
      animation: {
        'crt-flicker': 'flicker 4s infinite',
        'phosphor-pulse': 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
        'alert-pulse': 'alert 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
