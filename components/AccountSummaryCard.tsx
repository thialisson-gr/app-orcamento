// components/AccountSummaryCard.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface AccountSummaryCardProps {
  isReceita: boolean;
  totalGeral: number;
  totalConcluido: number;
  totalPendente: number;
  corPrincipal: string;
}

export function AccountSummaryCard({ isReceita, totalGeral, totalConcluido, totalPendente, corPrincipal }: AccountSummaryCardProps) {
  const { colors, isDarkMode } = useTheme();

  return (
    <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: isDarkMode ? '#334155' : 'transparent', borderWidth: isDarkMode ? 1 : 0 }]}>
      <View style={styles.cardInfoRow}>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
           <Ionicons name={isReceita ? "wallet-outline" : "receipt-outline"} size={16} color={colors.subText}/>
           <Text style={[styles.cardLabelMain, { color: colors.subText }]}>{isReceita ? 'Total Esperado' : 'Total da Fatura'}</Text>
        </View>
        <Text style={[styles.cardValueMain, { color: colors.text }]}>R$ {totalGeral.toFixed(2)}</Text>
      </View>

      <View style={styles.cardStatsGrid}>
        <View style={styles.statItem}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4}}>
            <Ionicons name="checkmark-circle" size={14} color={corPrincipal} />
            <Text style={[styles.statItemLabel, {color: colors.subText, marginBottom: 0}]}>{isReceita ? 'Recebido' : 'Pago'}</Text>
          </View>
          <Text style={[styles.statItemValue, {color: corPrincipal}]}>R$ {totalConcluido.toFixed(2)}</Text>
        </View>
        
        <View style={{ width: 1, backgroundColor: isDarkMode ? '#334155' : '#f1f5f9', marginHorizontal: 12 }} />
        
        <View style={[styles.statItem, {alignItems: 'flex-end'}]}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4, justifyContent: 'flex-end'}}>
            <Ionicons name="alert-circle" size={14} color={totalPendente > 0 ? "#ef4444" : colors.subText} />
            <Text style={[styles.statItemLabel, {color: colors.subText, marginBottom: 0}]}>Pendente</Text>
          </View>
          <Text style={[styles.statItemValue, totalPendente > 0 ? { color: '#ef4444' } : { color: colors.subText }]}>R$ {totalPendente.toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryCard: { marginTop: -40, borderRadius: 24, padding: 24, marginBottom: 24, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
  cardInfoRow: { marginBottom: 20, alignItems: 'center' }, 
  cardLabelMain: { fontSize: 13, marginBottom: 6, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }, 
  cardValueMain: { fontSize: 34, fontWeight: '800' },
  cardStatsGrid: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 16 },
  statItem: { flex: 1 }, 
  statItemLabel: { fontSize: 12, marginBottom: 4, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }, 
  statItemValue: { fontSize: 18, fontWeight: 'bold' }
});