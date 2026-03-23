import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        
        {/* Este é o modal padrão que veio no Expo. Você pode apagá-lo depois se não for usar */}
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        
        {/* 👇 NOSSA NOVA TELA DE ADICIONAR TRANSAÇÃO CONFIGURADA COMO MODAL 👇 */}
        <Stack.Screen 
          name="add-transaction" 
          options={{ 
            presentation: 'modal', 
            headerShown: false // Deixamos false porque já fizemos nosso botão "X" personalizado na tela
          }} 
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}