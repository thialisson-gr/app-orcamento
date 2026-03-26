// app/_layout.tsx
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { ThemeProvider } from '../hooks/useTheme'; // 👈 NOVO IMPORT

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
    // 👇 NOVO: Tudo dentro do ThemeProvider!
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
      </Stack>
    </ThemeProvider>
  );
}