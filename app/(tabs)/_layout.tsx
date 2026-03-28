// app/(tabs)/_layout.tsx
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Dimensions, Platform, Text, TouchableOpacity, View } from 'react-native'; // 👈 Importei o Platform
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

  const routes: Route[] = [
    { key: 'index', title: 'Início', icon: 'home' },
    { key: 'accounts', title: 'Contas', icon: 'wallet' },
    { key: 'stats', title: 'Gráficos', icon: 'pie-chart' },
    { key: 'profile', title: 'Perfil', icon: 'person' },
  ];

  const renderScene = SceneMap({
    index: Index,
    accounts: Accounts,
    stats: Stats,
    profile: Profile,
  });

  const renderTabBar = ({ navigationState, jumpTo }: TabBarProps) => (
    // 👇 Adicionei paddingBottom pro iOS não sobrepor a barra nativa do iPhone
    <View style={{ flexDirection: 'row', backgroundColor: colors.card, borderTopColor: isDarkMode ? '#374151' : '#e5e7eb', borderTopWidth: 1, paddingBottom: Platform.OS === 'ios' ? 20 : 0 }}>
      {navigationState.routes.map((route, i) => {
        const isActive = i === navigationState.index;
        return (
          <TouchableOpacity
            key={route.key}
            onPress={() => jumpTo(route.key)}
            style={{ flex: 1, alignItems: 'center', paddingVertical: 13 }}
          >
            <Ionicons name={route.icon} size={24} color={isActive ? colors.accent : colors.subText} />
            <Text style={{ color: isActive ? colors.accent : colors.subText, fontSize: 12 }}>{route.title}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      renderTabBar={renderTabBar}
      onIndexChange={setIndex}
      initialLayout={{ width: Dimensions.get('window').width }}
      swipeEnabled={false}
      animationEnabled={true}
      tabBarPosition="bottom" // 👈 AQUI ESTÁ A MÁGICA! Joga a barra pro fundo.
      style={{ flex: 1 }}
    />
  );
}