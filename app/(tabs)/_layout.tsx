import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // Esconde o cabeçalho padrão
        tabBarShowLabel: false, // Esconde os textos das abas para um visual mais limpo e moderno
        tabBarActiveTintColor: '#3b82f6', // Azul moderno para o ícone ativo
        tabBarInactiveTintColor: '#9ca3af', // Cinza para os inativos
        tabBarStyle: styles.floatingTabBar,
      }}>
      
      {/* ABA 1: DASHBOARD (Home) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.iconFocused : null}>
              <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
            </View>
          ),
        }}
      />

      {/* ABA 2: CONTAS E CARTÕES */}
      <Tabs.Screen
        name="accounts"
        options={{
          title: 'Contas',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.iconFocused : null}>
              <Ionicons name={focused ? 'wallet' : 'wallet-outline'} size={24} color={color} />
            </View>
          ),
        }}
      />

      {/* ABA 3: PERFIL E CONFIGURAÇÕES */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.iconFocused : null}>
              <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  floatingTabBar: {
    position: 'absolute',
    bottom: 24, // Distância do fundo da tela
    left: 24,   // Margem lateral
    right: 24,  // Margem lateral
    elevation: 8, // Sombra no Android
    shadowColor: '#000', // Sombra no iOS
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    backgroundColor: '#ffffff',
    borderRadius: 32, // Bordas bem arredondadas
    height: 64,
    borderTopWidth: 0, // Remove a linha feia padrão que fica em cima da tab
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconFocused: {
    // Um pequeno detalhe visual extra quando o ícone está ativo
    backgroundColor: '#eff6ff', // Azul bem clarinho
    padding: 10,
    borderRadius: 20,
  }
});