// components/MiniStatsCards.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface MiniStatsCardsProps {
  aReceber: number;
  individual: number;
}

export function MiniStatsCards({ aReceber, individual }: MiniStatsCardsProps) {
  const { isDarkMode } = useTheme();

  return (
    <View style={{ flexDirection: 'row', marginBottom: 24 }}>
      {/* CARD: A RECEBER */}
      <View style={{ flex: 1, borderRadius: 20, padding: 16, backgroundColor: isDarkMode ? '#4c1d95' : '#fdf2f8', marginRight: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: 'bold', color: isDarkMode ? '#f9a8d4' : '#be185d', textTransform: 'uppercase' }}>A Receber</Text>
          <Ionicons name="people" size={16} color={isDarkMode ? '#fbcfe8' : '#be185d'} />
        </View>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: isDarkMode ? '#fbcfe8' : '#be185d' }}>
          R$ {aReceber.toFixed(2)}
        </Text>
      </View>
      
      {/* CARD: INDIVIDUAL */}
      <View style={{ flex: 1, borderRadius: 20, padding: 16, backgroundColor: isDarkMode ? '#1e3a8a' : '#f0f9ff' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: 'bold', color: isDarkMode ? '#bfdbfe' : '#0369a1', textTransform: 'uppercase' }}>Individual</Text>
          <Ionicons name="person" size={16} color={isDarkMode ? '#bfdbfe' : '#0369a1'} />
        </View>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: isDarkMode ? '#bfdbfe' : '#0369a1' }}>
          R$ {individual.toFixed(2)}
        </Text>
      </View>
    </View>
  );
}