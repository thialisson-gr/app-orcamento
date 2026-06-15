// components/ExpensesDonutChart.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { useTheme } from '../hooks/useTheme';


interface ExpensesDonutChartProps {
  data: any[];
  totalDespesas: number;
  totalGastoString: string[];
}

export function ExpensesDonutChart({ data, totalDespesas, totalGastoString }: ExpensesDonutChartProps) {
  const { colors, isDarkMode } = useTheme();

  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 24, padding: 24, marginBottom: 20, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, borderWidth: isDarkMode ? 1 : 0, borderColor: '#334155' }}>
      <Text style={{ textAlign: 'center', fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 20, width: '100%' }}>
        Suas Despesas
      </Text>
      
      {totalDespesas === 0 ? (
        <View style={{ height: 180, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="pie-chart-outline" size={48} color={colors.subText} />
          <Text style={{ color: colors.subText, marginTop: 12, fontSize: 14 }}>Nenhuma transação.</Text>
        </View>
      ) : (
        <PieChart
          data={data}
          donut 
          radius={120} 
          innerRadius={95} 
          innerCircleColor={colors.card}
          isAnimated
          animationDuration={800}
          inwardExtraLengthForFocused={8}
          innerCircleBorderWidth={1}
          innerCircleBorderColor={isDarkMode ? '#374151' : '#f9f6f1'}
          centerLabelComponent={() => {
            const centerTextColor = isDarkMode ? '#f8fafc' : '#1f2937';
            const centerSubtitleColor = isDarkMode ? '#94a3b8' : '#6b7280';
            return (
              <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, color: centerSubtitleColor, marginBottom: 2, fontWeight: '500' }}>Você Gasta</Text>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <Text style={{ fontSize: 32, fontWeight: 'bold', color: centerTextColor, marginTop: 1, marginRight: 1 }}>R$ </Text>
                  <Text style={{ fontSize: 32, fontWeight: 'bold', color: centerTextColor }}>{totalGastoString[0]}</Text>
                  <Text style={{ fontSize: 16, color: centerTextColor, marginTop: 6 }}>,{totalGastoString[1]}</Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}