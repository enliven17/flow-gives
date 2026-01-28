import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          primary: '#0a0a0a',      // Main background
          secondary: '#141414',    // Card backgrounds
          tertiary: '#1e1e1e',     // Elevated surfaces
        },
        text: {
          primary: '#ffffff',      // Main text
          secondary: '#a3a3a3',    // Secondary text
          muted: '#737373',        // Muted text
        },
        accent: {
          primary: '#10b981',      // Green accent (was blue)
          secondary: '#059669',    // Dark green secondary (was purple)
          success: '#10b981',      // Green for success
          warning: '#10b981',      // Green for warnings (was orange)
          error: '#ef4444',        // Red for errors
        },
        border: {
          default: '#262626',      // Default borders
          hover: '#404040',        // Hover state borders
        },
      },
      borderRadius: {
        sm: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.5)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'scale-in': 'scaleIn 0.4s ease-out',
        'glow': 'glow 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
      },
    },
  },
  plugins: [],
};
export default config;
