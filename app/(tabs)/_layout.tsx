// app/(tabs)/_layout.tsx
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: styles.floatingTabBar,
        
        // Mantém a nossa correção para o botão não desaparecer:
        tabBarButton: (props) => {
          const { delayLongPress, ref, ...restoDasProps } = props as any;
          return (
            <TouchableOpacity 
              {...restoDasProps} 
              activeOpacity={0.8} 
            />
          );
        }
      }}>
      
      {/* ABA 1: DASHBOARD (Home) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconFocused]}>
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
            <View style={[styles.iconContainer, focused && styles.iconFocused]}>
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
            <View style={[styles.iconContainer, focused && styles.iconFocused]}>
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
    bottom: Platform.OS === 'ios' ? 32 : 24, // Sobe mais um pouquinho no iOS
    marginRight: 16,
    marginLeft: 16,
    left: 0,
    right: 0,
    elevation: 8, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    backgroundColor: '#ffffff',
    borderRadius: 32, // Formato de pílula
    height: 50, // Altura perfeita
    borderTopWidth: 0,
    paddingBottom: 0, // 👈 O SEGREDO AQUI: Impede o celular de empurrar o ícone
  },
  iconContainer: {
    width: 40, // Tamanho fixo para garantir que o círculo fique perfeito
    height: 40,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8, // Centraliza perfeitamente no meio da barra
  },
  iconFocused: {
    backgroundColor: '#eff6ff', 
  }
});