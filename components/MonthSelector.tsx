// components/MonthSelector.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';

// 👇 Definimos as "Props" (o que o componente precisa receber de quem for usá-lo)
interface MonthSelectorProps {
  mesFormatado: string;
  onPrev: () => void;
  onNext: () => void;
}

export function MonthSelector({ mesFormatado, onPrev, onNext }: MonthSelectorProps) {
  const { colors, isDarkMode } = useTheme();

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.card, padding: 6, borderRadius: 30, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, borderWidth: isDarkMode ? 1 : 0, borderColor: '#334155' }}>
      <TouchableOpacity onPress={onPrev} style={{ padding: 10, backgroundColor: colors.accentLight, borderRadius: 24 }} activeOpacity={0.7}>
        <Ionicons name="chevron-back" size={16} color={colors.accent} />
      </TouchableOpacity>
      
      <Text style={{ fontSize: 15, fontWeight: 'bold', color: colors.text }}>
        {mesFormatado}
      </Text>
      
      <TouchableOpacity onPress={onNext} style={{ padding: 10, backgroundColor: colors.accentLight, borderRadius: 24 }} activeOpacity={0.7}>
        <Ionicons name="chevron-forward" size={16} color={colors.accent} />
      </TouchableOpacity>
    </View>
  );
}