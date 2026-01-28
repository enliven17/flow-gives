/**
 * ThemeToggle Component
 * 
 * A button component that toggles between dark and light themes.
 * 
 * Features:
 * - Visual indicator of current theme
 * - Smooth transition animation
 * - Accessible button with proper labels
 * 
 * Requirements: 2.1, 2.2
 */

'use client';


import { useTheme } from '../contexts';

/**
 * ThemeToggle component props
 */
export interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

/**
 * ThemeToggle - Button to toggle between dark and light themes
 * 
 * @param props Component props
 * @returns ThemeToggle component
 * 
 * Requirements: 2.1, 2.2
 */
export function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg
        bg-background-tertiary hover:bg-background-tertiary/80
        border border-border-default hover:border-accent-primary/50
        text-text-primary transition-all duration-300
        hover:bg-background-tertiary
        focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2
        focus:ring-offset-background-primary
        ${className}
      `}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {/* Icon with animation */}
      <span className="text-xl transition-transform duration-300 hover:rotate-12" role="img" aria-hidden="true">
        {isDark ? '🌙' : '☀️'}
      </span>

      {/* Optional label */}
      {showLabel && (
        <span className="text-sm font-medium">
          {isDark ? 'Dark' : 'Light'} Mode
        </span>
      )}
    </button>
  );
}
