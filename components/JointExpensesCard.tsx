// components/JointExpensesCard.tsx
import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface JointExpensesCardProps {
  total: number;
  minhaParte: number;
  nomeParceiro: string;
  parteParceiro: number;
}

export function JointExpensesCard({ total, minhaParte, nomeParceiro, parteParceiro }: JointExpensesCardProps) {
  const { colors, isDarkMode } = useTheme();

  // Se não houver despesas conjuntas no mês, não renderiza o cartão
  if (total <= 0) return null;

  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 24, padding: 20, elevation: 2, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, borderWidth: isDarkMode ? 1 : 0, borderColor: '#334155' }}>
      <Text style={{ fontSize: 12, color: colors.subText, marginBottom: 6, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Despesas Conjuntas
      </Text>
      <Text style={{ fontSize: 26, fontWeight: 'bold', color: colors.text, marginBottom: 16 }}>
        R$ {total.toFixed(2)}
      </Text>
      
      {/* Cápsula interna com a divisão */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: isDarkMode ? '#334155' : '#f1f5f9' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: colors.subText, marginBottom: 4, fontWeight: '600', textTransform: 'uppercase' }}>
            Sua Parte
          </Text>
          <Text style={{ fontSize: 15, fontWeight: 'bold', color: colors.text }}>
            R$ {minhaParte.toFixed(2)}
          </Text>
        </View>
        
        <View style={{ width: 1, backgroundColor: isDarkMode ? '#334155' : '#e2e8f0', marginHorizontal: 12 }} />
        
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: colors.subText, marginBottom: 4, fontWeight: '600', textTransform: 'uppercase' }}>
            {nomeParceiro}
          </Text>
          <Text style={{ fontSize: 15, fontWeight: 'bold', color: colors.text }}>
            R$ {parteParceiro.toFixed(2)}
          </Text>
        </View>
      </View>
    </View>
  );
}