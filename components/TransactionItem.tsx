import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';

// Função auxiliar para deixar a data limpa (ex: 15/Jan)
const formatarData = (dataString: string) => {
  if (!dataString) return '';
  const data = new Date(dataString);
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace(' de ', '/').replace('.', '');
};

// Função para escolher um ícone que combine com a categoria
const getIconName = (tag: string) => {
  const t = tag.toLowerCase();
  if (t.includes('mercado') || t.includes('comida') || t.includes('alimentação')) return 'cart-outline';
  if (t.includes('carro') || t.includes('transporte') || t.includes('combustível')) return 'car-outline';
  if (t.includes('casa') || t.includes('aluguel') || t.includes('moradia') || t.includes('conta')) return 'home-outline';
  if (t.includes('lazer') || t.includes('entretenimento')) return 'game-controller-outline';
  if (t.includes('saúde') || t.includes('farmácia') || t.includes('medicação')) return 'medkit-outline';
  if (t.includes('roupa') || t.includes('vestuário')) return 'shirt-outline';
  if (t.includes('receita') || t.includes('salário') || t.includes('dinheiro')) return 'cash-outline';
  if (t.includes('estudo') || t.includes('curso') || t.includes('educação')) return 'book-outline';
  return 'receipt-outline'; // Ícone padrão
};

export function TransactionItem({ item, onPress }: { item: any, onPress: () => void }) {
  const { colors, isDarkMode } = useTheme();
  
  const isReceita = item.type === 'RECEITA';
  const tagPrincipal = item.tags && item.tags.length > 0 ? item.tags[0] : 'Outros';
  const iconName = getIconName(tagPrincipal);
  
  // Captura a data exata da compra/inserção
  const dataInsercao = item.purchaseDate ? formatarData(item.purchaseDate) : formatarData(item.date);

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: colors.card, borderColor: isDarkMode ? '#334155' : '#f1f5f9' }]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* 1. Ícone Redondo Dinâmico */}
      <View style={[styles.iconContainer, { backgroundColor: isReceita ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)' }]}>
        <Ionicons name={iconName as any} size={22} color={isReceita ? '#10b981' : '#ef4444'} />
      </View>

      {/* 2. Textos e Detalhes */}
      <View style={styles.infoContainer}>
        {/* Título Principal */}
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {item.descricao}
        </Text>
        
        {/* Linha da Tabela e Tag */}
        <View style={styles.subInfoRow}>
          <Ionicons name="wallet-outline" size={12} color={colors.subText} style={{ marginRight: 4 }} />
          <Text style={[styles.badgeText, { color: colors.subText }]} numberOfLines={1}>
            {item.accountId}
          </Text>
          
          <View style={[styles.dot, { backgroundColor: isDarkMode ? '#475569' : '#cbd5e1' }]} />
          
          <Text style={[styles.badgeText, { color: colors.subText, flexShrink: 1 }]} numberOfLines={1}>
            {tagPrincipal}
          </Text>
        </View>

        {/* Linha da Data de Inserção */}
        <View style={[styles.subInfoRow, { marginTop: 4 }]}>
          <Ionicons name="calendar-outline" size={12} color={colors.subText} style={{ marginRight: 4 }} />
          <Text style={{ fontSize: 11, color: colors.subText, fontWeight: '500' }}>
            Inserido dia {dataInsercao}
          </Text>
        </View>
      </View>

      {/* 3. Valor Formatado */}
      <View style={styles.amountContainer}>
        <Text style={[styles.amount, { color: isReceita ? '#10b981' : colors.text }]}>
          {isReceita ? '+' : '-'} R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 6,
  },
  amountContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  amount: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
});