// components/MonthClosingCard.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, Text, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface BalancoItem {
  nome: string;
  valor: number;
  tipo: string;
}

interface MonthClosingCardProps {
  balanco: BalancoItem[];
  saldoFinal: number;
}

const formatarMoeda = (valor: number) => {
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export function MonthClosingCard({ balanco, saldoFinal }: MonthClosingCardProps) {
  const { colors, isDarkMode } = useTheme();

  if (balanco.length === 0) return null;

  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 24, paddingVertical: 24, paddingHorizontal: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, borderWidth: isDarkMode ? 1 : 0, borderColor: '#334155', alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 10 }}>
        <Ionicons name="calculator" size={20} color={colors.subText} />
        <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.subText, textTransform: 'uppercase', letterSpacing: 1 }}>Seu Fechamento do Mês</Text>
      </View>

      <View style={{ width: '100%', maxWidth: 320 }}>
        {balanco.map((tabela) => {
          const isReceita = tabela.tipo === 'RECEITA';
          const corTexto = isReceita ? '#10b981' : '#ef4444'; 
          const sinal = isReceita ? '+' : '-';

          return (
            <View key={tabela.nome} style={{ flexDirection: 'row', width: '100%', marginBottom: 12, alignItems: 'center' }}>
              <View style={{ flex: 1.2, flexDirection: 'row', justifyContent: 'flex-end', paddingRight: 16 }}>
                <Text style={{ fontSize: 18, color: corTexto, marginRight: 8, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
                  {sinal}
                </Text>
                <Text style={{ fontSize: 18, fontWeight: '600', color: corTexto, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
                  {formatarMoeda(tabela.valor)}
                </Text>
              </View>
              <View style={{ flex: 1, paddingLeft: 16, borderLeftWidth: 1, borderLeftColor: isDarkMode ? '#334155' : '#e2e8f0', justifyContent: 'center' }}>
                <Text style={{ fontSize: 15, color: colors.text, fontWeight: '600' }} numberOfLines={1}>{tabela.nome}</Text>
              </View>
            </View>
          );
        })}

        <View style={{ height: 2, backgroundColor: isDarkMode ? '#334155' : '#e2e8f0', width: '100%', marginVertical: 20, borderRadius: 2 }} />

        <View style={{ flexDirection: 'row', width: '100%', alignItems: 'center' }}>
          <View style={{ flex: 1.2, flexDirection: 'row', justifyContent: 'flex-end', paddingRight: 16 }}>
            <Text style={{ fontSize: 26, color: saldoFinal >= 0 ? '#10b981' : '#ef4444', marginRight: 8, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
              {saldoFinal >= 0 ? '+' : '-'}
            </Text>
            <Text style={{ fontSize: 26, fontWeight: 'bold', color: saldoFinal >= 0 ? '#10b981' : '#ef4444', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
              {formatarMoeda(Math.abs(saldoFinal))}
            </Text>
          </View>
          <View style={{ flex: 1, paddingLeft: 16, borderLeftWidth: 1, borderLeftColor: 'transparent', justifyContent: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.subText, textTransform: 'uppercase', letterSpacing: 0.5 }}>Saldo</Text>
          </View>
        </View>
      </View>
    </View>
  );
}