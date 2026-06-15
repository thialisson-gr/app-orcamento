// components/AccountTransactionItem.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface AccountTransactionItemProps {
  item: any;
  isReceita: boolean;
  corPrincipal: string;
  onToggleCheck: () => void;
  onOptionsPress: () => void;
}

export function AccountTransactionItem({ item, isReceita, corPrincipal, onToggleCheck, onOptionsPress }: AccountTransactionItemProps) {
  const { colors, isDarkMode } = useTheme();

  const formatarData = (dataIso: string) => {
    if (!dataIso) return '';
    return new Date(dataIso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <View style={[styles.transactionItem, { borderBottomColor: isDarkMode ? '#334155' : '#f1f5f9' }]}>
      
      {/* Botão de Check/Bolinha */}
      <TouchableOpacity style={styles.checkboxArea} onPress={onToggleCheck} activeOpacity={0.6}>
        <View style={[styles.checkbox, { borderColor: isDarkMode ? '#475569' : '#cbd5e1' }, item.isPaid && { backgroundColor: corPrincipal, borderColor: corPrincipal }]}>
          {item.isPaid && <Ionicons name="checkmark" size={14} color="#fff" />}
        </View>
      </TouchableOpacity>
      
      {/* Informações da Transação */}
      <View style={styles.transactionDetails}>
        <Text style={[styles.transactionDesc, { color: colors.text }, item.isPaid && styles.textStrikethrough]} numberOfLines={1}>{item.descricao}</Text>
        <Text style={[styles.transactionMeta, { color: colors.subText }]}>{item.tags ? item.tags[0] : ''} {item.isInstallment && `${item.installmentDetails?.current}/${item.installmentDetails?.total}`}</Text>
      </View>
      
      {/* Valores e Data */}
      <View style={styles.transactionRight}>
        <Text style={[styles.transactionAmount, { color: colors.text }, item.isPaid && styles.textStrikethroughMuted]}>R$ {item.amount.toFixed(2)}</Text>
        
        {item.isPaid ? (
          <View style={{ alignItems: 'flex-end', marginTop: 2 }}>
            <Text style={{ fontSize: 9, color: colors.subText }}>{isReceita ? 'Previsto:' : 'Venc:'} {formatarData(item.paymentDate || item.date)}</Text>
            <Text style={{ fontSize: 10, color: corPrincipal, fontWeight: '700', marginTop: 1 }}>{item.paidAt ? `${isReceita ? 'Recebido:' : 'Pago:'} ${formatarData(item.paidAt)}` : (isReceita ? 'Recebido' : 'Pago')}</Text>
          </View>
        ) : (
          <Text style={{ fontSize: 10, color: colors.subText, marginTop: 2 }}>{isReceita ? 'Previsto:' : 'Vence:'} {formatarData(item.paymentDate || item.date)}</Text>
        )}
      </View>

      {/* Três pontinhos de Opções */}
      <TouchableOpacity style={styles.optionsArea} onPress={onOptionsPress}>
        <Ionicons name="ellipsis-vertical" size={20} color={colors.subText} />
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  transactionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
  checkboxArea: { width: 36, height: 36, justifyContent: 'center', alignItems: 'flex-start' }, 
  checkbox: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  transactionDetails: { flex: 1, paddingRight: 8 }, 
  transactionDesc: { fontSize: 15, fontWeight: '600', marginBottom: 2 }, 
  transactionMeta: { fontSize: 12 },
  transactionRight: { alignItems: 'flex-end', justifyContent: 'center' }, 
  transactionAmount: { fontSize: 15, fontWeight: 'bold', marginBottom: 2 }, 
  optionsArea: { paddingLeft: 12, paddingVertical: 10, justifyContent: 'center', alignItems: 'flex-end' },
  textStrikethrough: { textDecorationLine: 'line-through', color: '#94a3b8' }, 
  textStrikethroughMuted: { color: '#94a3b8' },
});