// app/_layout.tsx
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { ThemeProvider } from '../hooks/useTheme';

// 1. SEGURA A SPLASH SCREEN: Diz para o app não esconder a tela inicial nativa ainda
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { user, loadingAuth } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Se ainda está carregando o Firebase, não fazemos nada
    if (loadingAuth) return; 
    
    const inAuthGroup = segments[0] === 'login';

    // Lógica de redirecionamento
    if (!user && !inAuthGroup) {
      router.replace('/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
    
    // 2. LIBERA A SPLASH SCREEN: O Firebase carregou e a rota foi decidida! 
    // Agora podemos esconder a tela de abertura com um fade suave.
    SplashScreen.hideAsync();

  }, [user, loadingAuth, segments, router]);

  // 3. Enquanto carrega, mantemos o retorno null. 
  // A diferença é que agora o usuário estará vendo a Splash Screen bonita ao invés de um fundo branco!
  if (loadingAuth) return null;

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
        
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