// app/_layout.tsx
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { ThemeProvider } from '../hooks/useTheme';

export default function RootLayout() {
  const { user, loadingAuth } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loadingAuth) return;
    const inAuthGroup = segments[0] === 'login';

    if (!user && !inAuthGroup) router.replace('/login');
    else if (user && inAuthGroup) router.replace('/(tabs)');
  }, [user, loadingAuth, segments]);

  if (loadingAuth) return null;

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
        
        {/* 👇 REGISTRAMOS A TELA DA TABELA AQUI PARA FORÇAR O DESLIZE */}
        <Stack.Screen 
          name="account/[id]" 
          options={{ animation: 'slide_from_right' }} 
        />
        
        {/* Telas que sobem de baixo (Modal) */}
        <Stack.Screen name="add-transaction" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="edit-transaction" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="add-account" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="edit-account" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />

      </Stack>
    </ThemeProvider>
  );
}