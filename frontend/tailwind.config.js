/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'cyber-black': '#0a0a0f',
        'cyber-dark': '#0d0d1a',
        'cyber-panel': '#111122',
        'cyber-border': '#1a1a3e',
        'neon-cyan': '#00f5ff',
        'neon-green': '#39ff14',
        'threat-red': '#ff2d55',
        'threat-amber': '#ff9500',
        'threat-purple': '#bf5af2',
        'neon-blue': '#0a84ff',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'neon-cyan': '0 0 20px rgba(0, 245, 255, 0.4), 0 0 60px rgba(0, 245, 255, 0.1)',
        'neon-green': '0 0 20px rgba(57, 255, 20, 0.4), 0 0 60px rgba(57, 255, 20, 0.1)',
        'neon-red': '0 0 20px rgba(255, 45, 85, 0.4), 0 0 60px rgba(255, 45, 85, 0.1)',
        'neon-amber': '0 0 20px rgba(255, 149, 0, 0.4)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.6)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'scanline': 'scanline 8s linear infinite',
        'flicker': 'flicker 0.15s infinite',
        'type': 'typing 3.5s steps(40, end)',
        'blink': 'blink 1s step-end infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(0,245,255,0.4)' },
          '50%': { boxShadow: '0 0 30px rgba(0,245,255,0.8), 0 0 60px rgba(0,245,255,0.4)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
      backgroundImage: {
        'grid-cyber': 'linear-gradient(rgba(0,245,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.03) 1px, transparent 1px)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
    },
  },
  plugins: [],
};
