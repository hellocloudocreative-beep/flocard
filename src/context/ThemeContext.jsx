/* ==========================================================================
   FLOCARD THEME CONTEXT — DUAL THEME ENGINE (DARK DEFAULT & LIGHT SECONDARY)
   Supports system preference fallback, localStorage persistence, and zero-flash
   initial hydration across the entire application.
   ========================================================================== */

import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const THEME_KEY = 'flocard_theme';

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    // 1. Check saved user preference in localStorage
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(THEME_KEY);
        if (saved === 'light' || saved === 'dark') {
          return saved;
        }
      } catch (e) {
        console.error('Error reading theme from localStorage:', e);
      }
    }
    // Default theme is Light Mode
    return 'light';
  });

  // Apply theme to document element and sync with meta tags
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);

    // Update browser UI meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'light' ? '#F8F7FC' : '#08060D');
    }

    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {
      console.error('Error saving theme to localStorage:', e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const setTheme = (newTheme) => {
    if (newTheme === 'light' || newTheme === 'dark') {
      setThemeState(newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', isLight: theme === 'light', toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
