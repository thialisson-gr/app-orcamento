// components/DonutLegend.tsx
import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface DonutLegendProps {
  data: any[];
  totalDespesas: number;
}

export function DonutLegend({ data, totalDespesas }: DonutLegendProps) {
  const { colors, isDarkMode } = useTheme();

  // Se não houver dados, não renderiza nada (igual estava na tela original)
  if (data.length === 0) return null;

  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 24, padding: 20, elevation: 2, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, borderWidth: isDarkMode ? 1 : 0, borderColor: '#334155' }}>
      {data.map((item, index) => {
        const porcentagem = totalDespesas > 0 ? ((item.value / totalDespesas) * 100).toFixed(1) : '0';
        const isLast = index === data.length - 1;

        return (
          <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: isLast ? 0 : 1, borderBottomColor: isDarkMode ? '#334155' : '#f3f4f6' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 14, height: 14, borderRadius: 7, marginRight: 12, backgroundColor: item.color }} />
              <Text style={{ fontSize: 15, color: colors.text, fontWeight: '600' }}>{item.label}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 12, color: colors.subText, marginBottom: 2, fontWeight: '500' }}>{porcentagem}%</Text>
              <Text style={{ fontSize: 15, fontWeight: 'bold', color: colors.text }}>R$ {item.value.toFixed(2)}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}