/**
 * ThemeContext - React Context for theme state management
 * 
 * This context provides:
 * - Theme state (dark/light mode)
 * - Theme toggle functionality
 * - Theme persistence in localStorage
 * 
 * Requirements: 2.1, 2.2
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

/**
 * Theme type
 */
export type Theme = 'dark' | 'light';

/**
 * Theme context interface
 */
export interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

/**
 * Theme context
 */
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Theme provider props
 */
export interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

/**
 * ThemeProvider - Provides theme state to the application
 * 
 * Features:
 * - Dark/light mode state management
 * - Theme toggle functionality
 * - Persists theme preference in localStorage
 * - Applies theme class to document element
 * 
 * @param props Provider props
 * @returns Provider component
 * 
 * Requirements: 2.1, 2.2
 */
export function ThemeProvider({ 
  children, 
  defaultTheme = 'dark',
  storageKey = 'flowgives-theme'
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    setMounted(true);
    
    try {
      const storedTheme = localStorage.getItem(storageKey) as Theme | null;
      if (storedTheme === 'dark' || storedTheme === 'light') {
        setThemeState(storedTheme);
      }
    } catch (error) {
      console.error('Failed to load theme from localStorage:', error);
    }
  }, [storageKey]);

  // Apply theme to document element and persist to localStorage
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    
    // Remove both classes first
    root.classList.remove('dark', 'light');
    
    // Add the current theme class
    root.classList.add(theme);
    
    // Persist to localStorage
    try {
      localStorage.setItem(storageKey, theme);
    } catch (error) {
      console.error('Failed to save theme to localStorage:', error);
    }
  }, [theme, mounted, storageKey]);

  /**
   * Toggle between dark and light themes
   * 
   * Requirements: 2.1, 2.2
   */
  const toggleTheme = useCallback(() => {
    setThemeState(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  /**
   * Set theme explicitly
   * 
   * @param newTheme Theme to set
   * 
   * Requirements: 2.1, 2.2
   */
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  const value: ThemeContextValue = {
    theme,
    toggleTheme,
    setTheme,
    isDark: theme === 'dark',
  };

  // Prevent flash of unstyled content by not rendering until mounted
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * useTheme hook - Access theme context
 * 
 * @returns Theme context value
 * @throws Error if used outside ThemeProvider
 * 
 * Requirements: 2.1, 2.2
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}
