// hooks/useTheme.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { StatusBar } from 'react-native';

export type ThemeName = 'indigo' | 'pink' | 'dark';

export const Colors = {
  indigo: {
    background: '#f8fafc', card: '#ffffff', text: '#0f172a', subText: '#64748b', accent: '#6366f1', accentLight: '#e0e7ff',
    gradient: ['#818cf8', '#4f46e5'] // 👈 Degradê Índigo
  },
  pink: {
    background: '#fdf2f8', card: '#ffffff', text: '#831843', subText: '#9d174d', accent: '#ec4899', accentLight: '#fce7f3',
    gradient: ['#f472b6', '#db2777'] // 👈 Degradê Pink
  },
  dark: {
    background: '#0f172a', card: '#1e293b', text: '#f8fafc', subText: '#94a3b8', accent: '#06b6d4', accentLight: '#164e63',
    gradient: ['#22d3ee', '#0891b2'] // 👈 Degradê Cyber
  }
};

type ThemeContextType = {
  activeTheme: ThemeName;
  isDarkMode: boolean; 
  setTheme: (theme: ThemeName) => void;
  colors: typeof Colors.indigo;
};

const ThemeContext = createContext<ThemeContextType>({
  activeTheme: 'indigo', isDarkMode: false, setTheme: () => {}, colors: Colors.indigo,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTheme, setActiveThemeState] = useState<ThemeName>('indigo');

  useEffect(() => {
    AsyncStorage.getItem('orcamento:theme').then(theme => {
      if (theme === 'dark' || theme === 'pink' || theme === 'indigo') setActiveThemeState(theme as ThemeName);
    });
  }, []);

  const setTheme = async (newTheme: ThemeName) => {
    setActiveThemeState(newTheme);
    await AsyncStorage.setItem('orcamento:theme', newTheme);
  };

  const colors = Colors[activeTheme];
  const isDarkMode = activeTheme === 'dark';

  return (
    <ThemeContext.Provider value={{ activeTheme, isDarkMode, setTheme, colors }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);