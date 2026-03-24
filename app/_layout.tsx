// app/_layout.tsx
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function RootLayout() {
  const { user, loadingAuth } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Se o Firebase ainda estiver carregando, espera quietinho.
    if (loadingAuth) return;

    // Descobre em qual tela o usuário está tentando entrar
    const inAuthGroup = segments[0] === 'login';

    if (!user && !inAuthGroup) {
      // NÃO ESTÁ LOGADO? É chutado para a tela de login.
      router.replace('/login');
    } else if (user && inAuthGroup) {
      // JÁ ESTÁ LOGADO e tentou abrir o login? Manda direto pro app!
      router.replace('/(tabs)');
    }
  }, [user, loadingAuth, segments]);

  // Se o Firebase não respondeu ainda, não mostra nada pra não piscar a tela
  if (loadingAuth) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* O sistema de abas e telas internas */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      {/* A tela de login (sem botão de voltar) */}
      <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
    </Stack>
  );
}