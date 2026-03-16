import { useState, useEffect, useCallback } from 'react';

interface ThemeColors {
  primary: string;
  primaryHover: string;
  primarySoft: string;
  primarySoftHover: string;
  cta: string;
  bg: string;
  surface: string;
  border: string;
  text: string;
  textMuted: string;
  divider: string;
  font: string;
  danger: string;
  dangerSoft: string;
  warning: string;
  success: string;
}

const LIGHT_COLORS: ThemeColors = {
  primary: '#6366F1',
  primaryHover: '#4F46E5',
  primarySoft: 'rgba(99,102,241,0.08)',
  primarySoftHover: 'rgba(99,102,241,0.14)',
  cta: '#10B981',
  bg: '#F7F6FF',
  surface: '#FFFFFF',
  border: '#EAE8F8',
  text: '#1E1B4B',
  textMuted: '#6B7280',
  divider: '#e2e8f0',
  font: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  danger: '#EF4444',
  dangerSoft: 'rgba(239,68,68,0.08)',
  warning: '#FDB022',
  success: '#10B981',
};

const DARK_COLORS: ThemeColors = {
  primary: '#818CF8',
  primaryHover: '#6366F1',
  primarySoft: 'rgba(129,140,248,0.1)',
  primarySoftHover: 'rgba(129,140,248,0.16)',
  cta: '#10B981',
  bg: '#0F0F1A',
  surface: '#16162A',
  border: '#2D2D52',
  text: '#F1F0FF',
  textMuted: '#A8A5C7',
  divider: '#2D2D52',
  font: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  danger: '#FF6B6B',
  dangerSoft: 'rgba(255,107,107,0.15)',
  warning: '#FDB022',
  success: '#34D399',
};

export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  const toggleTheme = useCallback(() => {
    const html = document.documentElement;
    const isCurrentlyDark = html.classList.contains('dark');
    
    if (isCurrentlyDark) {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  }, []);

  return {
    isDark,
    colors,
    toggleTheme,
  };
}

export function getThemeColors(isDark: boolean): ThemeColors {
  return isDark ? DARK_COLORS : LIGHT_COLORS;
}

export type { ThemeColors };
