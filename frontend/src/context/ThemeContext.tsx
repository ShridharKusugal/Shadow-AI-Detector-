import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeId = 'ocean' | 'midnight' | 'emerald' | 'royal' | 'slate';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  bgPreview: string;
  cardPreview: string;
  textPreview: string;
}

export const THEMES: ThemeConfig[] = [
  {
    id: 'ocean',
    name: 'Ocean Blue',
    tagline: 'Clean enterprise cybersecurity dashboard',
    primaryColor: '#2563EB',
    secondaryColor: '#0EA5E9',
    bgPreview: '#F4F7FB',
    cardPreview: '#FFFFFF',
    textPreview: '#172B4D',
  },
  {
    id: 'midnight',
    name: 'Midnight Navy',
    tagline: 'Premium dark SOC interface',
    primaryColor: '#60A5FA',
    secondaryColor: '#22D3EE',
    bgPreview: '#0B1220',
    cardPreview: '#111C2E',
    textPreview: '#E8EEF7',
  },
  {
    id: 'emerald',
    name: 'Emerald Green',
    tagline: 'Governance & compliance focus',
    primaryColor: '#047857',
    secondaryColor: '#10B981',
    bgPreview: '#F3F8F5',
    cardPreview: '#FFFFFF',
    textPreview: '#18352C',
  },
  {
    id: 'royal',
    name: 'Royal Purple',
    tagline: 'AI analytics with purple accents',
    primaryColor: '#6D28D9',
    secondaryColor: '#8B5CF6',
    bgPreview: '#F7F5FC',
    cardPreview: '#FFFFFF',
    textPreview: '#2E2450',
  },
  {
    id: 'slate',
    name: 'Slate Graphite',
    tagline: 'Minimalist neutral enterprise',
    primaryColor: '#475569',
    secondaryColor: '#0891B2',
    bgPreview: '#F5F6F8',
    cardPreview: '#FFFFFF',
    textPreview: '#1F2937',
  },
];

interface ThemeContextType {
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
  currentThemeConfig: ThemeConfig;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    const saved = localStorage.getItem('shadow_ai_theme') as ThemeId;
    if (saved && THEMES.some(t => t.id === saved)) return saved;
    return 'ocean';
  });

  const setTheme = (t: ThemeId) => {
    setThemeState(t);
    localStorage.setItem('shadow_ai_theme', t);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const currentThemeConfig = THEMES.find(t => t.id === theme) || THEMES[0];

  const value: ThemeContextType = { theme, setTheme, currentThemeConfig };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
};
