"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/** New key so legacy forced light/dark defaults do not stick */
const THEME_STORAGE_KEY = 'trialvo-theme';

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
    // ignore storage errors
  }
  return 'system';
}

function resolveTheme(themeToApply: Theme): 'light' | 'dark' {
  if (themeToApply !== 'system') return themeToApply;
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function applyThemeClass(resolved: 'light' | 'dark') {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(resolved);
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Always the same on the server and the first client paint. Reading
  // localStorage in useState is what made ThemeToggle hydrate as Moon/Dark
  // while the SSR HTML still said Monitor/system.
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStoredTheme();
    const resolved = resolveTheme(stored);
    setThemeState(stored);
    setResolvedTheme(resolved);
    applyThemeClass(resolved);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;

    const apply = (next: Theme) => {
      const resolved = resolveTheme(next);
      setResolvedTheme(resolved);
      applyThemeClass(resolved);
    };

    apply(theme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') apply('system');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, ready]);

  const setTheme = (next: Theme) => {
    setThemeState(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // ignore storage errors
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
