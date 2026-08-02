'use client';

import { useState, useEffect, useCallback } from 'react';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// THEME HOOK — Dark/Light/System mode toggle
// Persists to localStorage as 'noe-theme'
// Works with ThemeScript to prevent flash
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('light');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Read initial theme from localStorage
  useEffect(() => {
    const saved = (localStorage.getItem('noe-theme') as Theme) || 'light';
    setThemeState(saved);
    setResolvedTheme(getResolved(saved));
  }, []);

  // Listen for system preference changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (theme === 'system') {
        const resolved = mq.matches ? 'dark' : 'light';
        setResolvedTheme(resolved);
        applyTheme(resolved);
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const getResolved = (t: Theme): 'light' | 'dark' => {
    if (t === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return t;
  };

  const applyTheme = (resolved: 'light' | 'dark') => {
    const html = document.documentElement;
    html.classList.remove('light', 'dark');
    html.classList.add(resolved);
    html.style.colorScheme = resolved;
    html.style.backgroundColor = resolved === 'dark' ? '#0B0B0D' : '#FFFFFF';
  };

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('noe-theme', newTheme);
    const resolved = newTheme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : newTheme;
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, []);

  // Quick toggle: light → dark → system → light
  const toggleTheme = useCallback(() => {
    const next: Theme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(next);
  }, [theme, setTheme]);

  // Simple toggle: light ↔ dark
  const toggleDarkMode = useCallback(() => {
    const next: Theme = resolvedTheme === 'light' ? 'dark' : 'light';
    setTheme(next);
  }, [resolvedTheme, setTheme]);

  return {
    theme,        // 'light' | 'dark' | 'system'
    resolvedTheme, // always 'light' or 'dark'
    setTheme,
    toggleTheme,
    toggleDarkMode,
    isDark: resolvedTheme === 'dark',
  };
}
