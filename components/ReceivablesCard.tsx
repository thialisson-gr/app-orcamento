// components/ReceivablesCard.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface ReceivablesCardProps {
  total: number;
}

export function ReceivablesCard({ total }: ReceivablesCardProps) {
  const { isDarkMode } = useTheme();

  // A própria peça de Lego já decide se deve aparecer ou não!
  if (total <= 0) return null;

  return (
    <View style={{ backgroundColor: isDarkMode ? '#4c1d95' : '#fdf2f8', padding: 16, borderRadius: 20, marginBottom: 20 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{ fontSize: 12, color: isDarkMode ? '#f9a8d4' : '#be185d', marginBottom: 4, fontWeight: '600', textTransform: 'uppercase' }}>A Receber (Terceiros)</Text>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: isDarkMode ? '#fbcfe8' : '#be185d' }}>R$ {total.toFixed(2)}</Text>
        </View>
        <Ionicons name="people" size={24} color={isDarkMode ? '#fbcfe8' : '#be185d'} />
      </View>
    </View>
  );
}