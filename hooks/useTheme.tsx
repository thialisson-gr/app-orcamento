// hooks/useTheme.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

// 👇 AS 4 PALETAS DE CORES DEFINIDAS COM CONTRASTE MÁXIMO
const THEMES: Record<string, any> = {
  emerald: {
    background: '#F4F4F5',
    card: '#FFFFFF',
    text: '#064E3B', 
    subText: '#475569',
    accent: '#10B981', 
    accentLight: '#D1FAE5',
    gradient: ['#34D399', '#059669'],
  },
  sapphire: { // 👈 NOVO TEMA AZUL PREMIUM
    background: '#F4F4F5',
    card: '#FFFFFF',
    text: '#0F172A', 
    subText: '#475569',
    accent: '#2563EB', // Azul Royal
    accentLight: '#DBEAFE',
    gradient: ['#60A5FA', '#1D4ED8'],
  },
  graphite: { // 👈 NOVO TEMA PRETO/MINIMALISTA
    background: '#F4F4F5',
    card: '#FFFFFF',
    text: '#09090B', 
    subText: '#52525B',
    accent: '#18181B', // Quase preto
    accentLight: '#E4E4E7',
    gradient: ['#71717A', '#27272A'],
  },
  dark: {
    background: '#0f172a',
    card: '#1e293b',
    text: '#f8fafc',
    subText: '#94a3b8',
    accent: '#06b6d4', 
    accentLight: 'rgba(6, 182, 212, 0.2)',
    gradient: ['#22d3ee', '#0891b2'],
  }
};

type ThemeContextType = {
  activeTheme: string;
  isDarkMode: boolean;
  colors: any;
  setTheme: (theme: string) => void;
};

const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [activeTheme, setActiveThemeState] = useState('emerald'); 
  const [colors, setColors] = useState(THEMES.emerald);

  useEffect(() => {
    AsyncStorage.getItem('@app_theme').then((savedTheme) => {
      if (savedTheme && THEMES[savedTheme]) {
        setActiveThemeState(savedTheme);
        setColors(THEMES[savedTheme]);
      }
    });
  }, []);

  const setTheme = async (themeName: string) => {
    if (THEMES[themeName]) {
      setActiveThemeState(themeName);
      setColors(THEMES[themeName]);
      await AsyncStorage.setItem('@app_theme', themeName);
    }
  };

  const isDarkMode = activeTheme === 'dark';

  return (
    <ThemeContext.Provider value={{ activeTheme, isDarkMode, colors, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}