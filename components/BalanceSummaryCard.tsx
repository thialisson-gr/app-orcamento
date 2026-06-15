// components/BalanceSummaryCard.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface BalanceSummaryCardProps {
  saldoRestante: number;
  porcentagemGasta: number;
  receitaTotal: number;
  despesasTotais: number;
}

export function BalanceSummaryCard({ saldoRestante, porcentagemGasta, receitaTotal, despesasTotais }: BalanceSummaryCardProps) {
  const { colors } = useTheme();

  return (
    <LinearGradient 
      colors={colors.gradient as [string, string]} 
      start={{ x: 0, y: 0 }} 
      end={{ x: 1, y: 1 }} 
      style={{ borderRadius: 24, padding: 24, marginBottom: 20, elevation: 4, shadowColor: colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Previsão de Saldo do Mês
        </Text>
        <Ionicons name="wallet-outline" size={20} color="rgba(255,255,255,0.9)" />
      </View>
      
      <Text style={{ fontSize: 34, fontWeight: 'bold', color: '#ffffff', marginBottom: 16 }}>
        R$ {saldoRestante.toFixed(2)}
      </Text>
      
      <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, marginBottom: 8 }}>
        <View style={[
          { height: 6, backgroundColor: '#ffffff', borderRadius: 3 }, 
          { width: `${Math.min(porcentagemGasta, 100)}%` }
        ]} />
      </View>
      <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 20, fontWeight: '500' }}>
        Comprometido: {porcentagemGasta.toFixed(0)}% da receita.
      </Text>
      
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="arrow-up-circle" size={20} color="#6ee7b7" />
          <View>
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '600', textTransform: 'uppercase' }}>Receitas</Text>
            <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#ffffff' }}>R$ {receitaTotal.toFixed(2)}</Text>
          </View>
        </View>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="arrow-down-circle" size={20} color="#fca5a5" />
          <View>
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '600', textTransform: 'uppercase' }}>Despesas</Text>
            <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#ffffff' }}>R$ {despesasTotais.toFixed(2)}</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}