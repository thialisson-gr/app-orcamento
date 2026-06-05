// app/(tabs)/_layout.tsx
import { Ionicons } from '@expo/vector-icons';
import * as NavigationBar from 'expo-navigation-bar';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Dimensions, Platform, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SceneMap, TabView, type NavigationState, type SceneRendererProps } from 'react-native-tab-view';
import { useTheme } from '../../hooks/useTheme';
import Accounts from './accounts';
import Index from './index';
import Profile from './profile';
import Stats from './stats';

type Route = { key: string; title: string; icon: React.ComponentProps<typeof Ionicons>['name'] };

type TabBarProps = SceneRendererProps & {
  navigationState: NavigationState<Route>;
  jumpTo: (key: string) => void;
};

export default function TabsLayout() {
  const { colors, isDarkMode } = useTheme();
  const [index, setIndex] = useState<number>(0);
  const insets = useSafeAreaInsets(); 

  // 👇 Ajustado para o modo Edge-to-Edge nativo do Expo
  useEffect(() => {
    if (Platform.OS === 'android') {
      // Como a barra já é transparente, só precisamos garantir que os ícones
      // dos 3 botões (voltar, home, abas) fiquem visíveis no fundo do seu app.
      NavigationBar.setButtonStyleAsync(isDarkMode ? 'light' : 'dark');
    }
  }, [isDarkMode]);

  const routes: Route[] = [
    { key: 'index', title: 'Início', icon: 'home' },
    { key: 'accounts', title: 'Tabelas', icon: 'wallet' },
    { key: 'stats', title: 'Gráficos', icon: 'pie-chart' },
    { key: 'profile', title: 'Perfil', icon: 'person' },
  ];

  const renderScene = SceneMap({
    index: Index,
    accounts: Accounts,
    stats: Stats,
    profile: Profile,
  });

  const renderTabBar = ({ navigationState, jumpTo }: TabBarProps) => {
    // Calculamos a altura garantindo que a Pílula flutue perfeitamente acima da área dos botões
    const bottomSpacing = Platform.OS === 'ios' 
      ? Math.max(30, insets.bottom + 10) 
      : Math.max(20, insets.bottom + 10);

    return (
      <View style={{ position: 'absolute', bottom: bottomSpacing, left: 20, right: 20, alignItems: 'center' }}>
        
        {/* 💊 A BARRA PÍLULA */}
        <View style={{ flexDirection: 'row', width: '100%', height: 68, backgroundColor: colors.card, borderRadius: 34, alignItems: 'center', paddingHorizontal: 10, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, borderWidth: isDarkMode ? 1 : 0, borderColor: '#334155' }}>
          
          {navigationState.routes.map((route, i) => {
            const isActive = i === navigationState.index;
            return (
              <React.Fragment key={route.key}>
                
                {/* O buraco fantasma central */}
                {i === 2 && <View style={{ width: 70 }} />}
                
                <TouchableOpacity
                  onPress={() => jumpTo(route.key)}
                  style={{ flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%' }}
                  activeOpacity={0.7}
                >
                  <Ionicons name={isActive ? route.icon : `${route.icon}-outline` as any} size={22} color={isActive ? colors.accent : colors.subText} />
                  <Text style={{ color: isActive ? colors.accent : colors.subText, fontSize: 10, marginTop: 4, fontWeight: isActive ? 'bold' : '600' }}>{route.title}</Text>
                </TouchableOpacity>

              </React.Fragment>
            );
          })}
        </View>

        {/* ➕ BOTÃO CENTRAL SOBREPOSTO */}
        <TouchableOpacity 
          style={{ 
            position: 'absolute', 
            top: -24, 
            width: 64, 
            height: 64, 
            borderRadius: 32, 
            backgroundColor: colors.accent, 
            justifyContent: 'center', 
            alignItems: 'center', 
            elevation: 10, 
            shadowColor: colors.accent, 
            shadowOffset: { width: 0, height: 6 }, 
            shadowOpacity: 0.4, 
            shadowRadius: 8, 
            borderWidth: 6, 
            borderColor: colors.background // A borda usa o fundo nativo camuflado
          }} 
          activeOpacity={0.8}
          onPress={() => router.push('/add-transaction')}
        >
          <Ionicons name="add" size={32} color="#ffffff" />
        </TouchableOpacity>

      </View>
    );
  };

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      renderTabBar={renderTabBar}
      onIndexChange={setIndex}
      initialLayout={{ width: Dimensions.get('window').width }}
      swipeEnabled={false}
      animationEnabled={true}
      tabBarPosition="bottom" 
      style={{ flex: 1 }}
    />
  );
}