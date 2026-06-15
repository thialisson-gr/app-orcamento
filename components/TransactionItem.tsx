// components/TransactionItem.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface TransactionItemProps {
  item: any;
  onPress: () => void;
}

export function TransactionItem({ item, onPress }: TransactionItemProps) {
  const { colors, isDarkMode } = useTheme();

  // A formatação de data agora fica isolada aqui dentro!
  const formatarData = (dataIso: string) => {
    if (!dataIso) return '';
    const data = new Date(dataIso);
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }); 
  };

  const isReceita = item.type === 'RECEITA';

  return (
    <TouchableOpacity 
      style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, padding: 14, borderRadius: 16, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, borderWidth: isDarkMode ? 1 : 0, borderColor: '#334155' }} 
      activeOpacity={0.7} 
      onPress={onPress}
    >
      {/* Ícone Squircle */}
      <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: isReceita ? (isDarkMode ? 'rgba(16, 185, 129, 0.2)' : '#ecfdf5') : colors.accentLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
        <Ionicons name={isReceita ? "trending-up" : "cart-outline"} size={20} color={isReceita ? "#10b981" : colors.accent} />
      </View>
      
      {/* Meio: Descrição + (Categoria e Tabela) */}
      <View style={{ flex: 1, marginRight: 8 }}>
        <Text style={{ fontSize: 15, fontWeight: 'bold', color: colors.text, marginBottom: 2 }} numberOfLines={1}>{item.descricao}</Text>
        
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 11, color: colors.subText, fontWeight: '600' }}>{item.tags ? item.tags[0] : 'Outros'}</Text>
          <Text style={{ fontSize: 11, color: colors.subText, marginHorizontal: 4 }}>•</Text>
          <Text style={{ fontSize: 11, color: colors.subText }}>{item.accountId}</Text>
        </View>
      </View>
      
      {/* Direita: Valor + Status + Data */}
      <View style={{ alignItems: 'flex-end', justifyContent: 'center', paddingRight: 10, borderRightWidth: 1, borderRightColor: isDarkMode ? '#334155' : '#f1f5f9' }}>
        <Text style={{ fontSize: 15, fontWeight: 'bold', marginBottom: 2, color: isReceita ? '#10b981' : colors.text }}>{isReceita ? '+' : ''}R$ {item.amount.toFixed(2)}</Text>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {item.isPaid ? (
            <Text style={{ fontSize: 10, color: '#10b981', fontWeight: 'bold' }}>✅ {formatarData(item.dateParaExibir)}</Text>
          ) : (
            <Text style={{ fontSize: 10, color: colors.subText, fontWeight: '600' }}>⏳ {formatarData(item.dateParaExibir)}</Text>
          )}
        </View>
      </View>

      {/* Os 3 Pontinhos no canto */}
      <View style={{ paddingLeft: 10 }}>
        <Ionicons name="ellipsis-vertical" size={18} color={colors.subText} />
      </View>
    </TouchableOpacity>
  );
}