// components/TrendLineChart.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import { Dimensions, ScrollView, Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useTheme } from '../hooks/useTheme';

interface TrendLineChartProps {
  data: any[];
}

// Tiramos esses cálculos do arquivo principal e trouxemos para cá!
const screenWidth = Dimensions.get('window').width;
const cardWidth = screenWidth - 32;

export function TrendLineChart({ data }: TrendLineChartProps) {
  const { colors, isDarkMode } = useTheme();
  const scrollGraficoRef = useRef<ScrollView>(null);

  const temDadosEvolucao = data.some(item => item.value > 0);
  const larguraTotalBarras = data.length * 85;

  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 24, paddingVertical: 16, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, borderWidth: isDarkMode ? 1 : 0, borderColor: '#334155' }}>
      <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text, textAlign: 'center', marginBottom: 4 }}>Tendência e Previsão</Text>
      <Text style={{ fontSize: 13, color: colors.subText, textAlign: 'center', marginBottom: 10 }}>Evolução dos seus gastos</Text>
      
      {temDadosEvolucao ? (
        <ScrollView horizontal ref={scrollGraficoRef} showsHorizontalScrollIndicator={false}
          onContentSizeChange={() => {
            const meioDoGrafico = (larguraTotalBarras - cardWidth) / 2;
            scrollGraficoRef.current?.scrollTo({ x: meioDoGrafico, animated: false });
          }}
        >
          <View style={{ zIndex: 0, paddingHorizontal: 16, paddingTop: 60, paddingBottom: 10 }}>
            <LineChart
              data={data}
              height={140} 
              overflowTop={100} 
              overflowBottom={50} 
              areaChart 
              curved={false}
              initialSpacing={20}
              spacing={80} 
              thickness={3}
              color1={colors.accent}
              startFillColor1={colors.accent}
              endFillColor1={colors.accent}
              startOpacity={0.2} 
              endOpacity={0.0}
              hideRules 
              xAxisColor={isDarkMode ? '#334155' : '#e2e8f0'}
              yAxisThickness={0}
              hideYAxisText 
              disableScroll={true}                  
              xAxisLabelTextStyle={{ color: colors.subText, fontSize: 13}} 
            />
          </View>
        </ScrollView>
      ) : (
        <View style={{ padding: 30, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="trending-down" size={40} color={colors.subText} />
          <Text style={{ color: colors.subText, marginTop: 12, textAlign: 'center', fontSize: 14 }}>Sem histórico para exibir a tendência.</Text>
        </View>
      )}
      <Text style={{ fontSize: 12, color: colors.subText, marginTop: 15, textAlign: 'center', fontStyle: 'italic', paddingHorizontal: 10 }}>Deslize para ver o passado ou previsões.</Text>
    </View>
  );
}