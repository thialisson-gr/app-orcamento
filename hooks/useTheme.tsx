// hooks/useTheme.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { StatusBar } from 'react-native';

// 1. Definimos a paleta de cores Premium para os dois modos
export const Colors = {
  light: {
    background: '#f3f4f6', // Fundo Cinza Claríssimo (padrão do app)
    card: '#ffffff',       // Cards Brancos Puros
    text: '#1f2937',       // Texto Preto Rico
    subText: '#6b7280',    // Texto Cinza
    accent: '#3b82f6',     // Azul Padrão
    accentLight: '#eff6ff' // Azul Fundo
  },
  dark: {
    background: '#111827', // 👇 Fundo Preto Rico Sofisticado (não é #000 preto puro!)
    card: '#1f2937',       // 👇 Cards Cinza Escuro (cria hierarquia)
    text: '#f9fafb',       // 👇 Texto Quase Branco (confortável)
    subText: '#9ca3af',    // 👇 Texto Cinza Médio
    accent: '#60a5fa',     // 👇 Azul Neon vibrante para contrastar no escuro
    accentLight: '#263351' // 👇 Azul Fundo escuro
  }
};

type ThemeContextType = {
  isDarkMode: boolean;
  toggleTheme: () => void;
  colors: typeof Colors.light; // Usamos a estrutura do light como tipo
};

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  toggleTheme: () => {},
  colors: Colors.light,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 👇 Carrega a preferência do usuário do cache do celular
  useEffect(() => {
    AsyncStorage.getItem('orcamento:theme').then(theme => {
      setIsDarkMode(theme === 'dark');
    });
  }, []);

  const toggleTheme = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    // 👇 Salva a preferência para o app abrir no modo certo na próxima vez
    await AsyncStorage.setItem('orcamento:theme', newMode ? 'dark' : 'light');
  };

  const colors = isDarkMode ? Colors.dark : Colors.light;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, colors }}>
      {/* 2. A Mágica da StatusBar: Ela muda de cor sozinha */}
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      {children}
    </ThemeContext.Provider>
  );
};

// 👇 Hook customizado para usar o tema facilmente em qualquer tela
export const useTheme = () => useContext(ThemeContext);