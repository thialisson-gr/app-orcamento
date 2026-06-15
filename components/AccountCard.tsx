// components/AccountCard.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface AccountCardProps {
  conta: any;
  transacoes: any[];
  mesAtual: number;
  anoAtual: number;
  perfil: string | null;
  onPress: () => void;
  onOptionsPress: () => void;
}

export function AccountCard({ conta, transacoes, mesAtual, anoAtual, perfil, onPress, onOptionsPress }: AccountCardProps) {
  const { colors, isDarkMode } = useTheme();

  const isReceita = conta.tipo === 'RECEITA';
  const transacoesContaMes = transacoes.filter(t => t.accountId === conta.nome && new Date(t.paymentDate || t.date).getMonth() === mesAtual && new Date(t.paymentDate || t.date).getFullYear() === anoAtual);
  
  const totalFatura = transacoesContaMes.filter(t => t.type === (isReceita ? 'RECEITA' : 'DESPESA')).reduce((acc, t) => acc + t.amount, 0);
  const totalConcluido = transacoesContaMes.filter(t => t.type === (isReceita ? 'RECEITA' : 'DESPESA') && t.isPaid).reduce((acc, t) => acc + t.amount, 0);
  const pendente = totalFatura - totalConcluido;

  let iconName = 'wallet';
  let gradColors = colors.gradient; 

  if (conta.tipo === 'RECEITA') {
    iconName = 'trending-up';
    gradColors = ['#10b981', '#059669']; 
  } else if (conta.tipo === 'COMUM') {
    iconName = 'home';
  } else if (conta.tipo === 'INDIVIDUAL') {
    iconName = 'person';
    gradColors = ['#3b82f6', '#2563eb']; 
  } else if (conta.tipo === 'TERCEIROS') {
    iconName = 'people';
    gradColors = ['#f43f5e', '#e11d48']; 
  }

  let minhaPerc = 50;
  let parcPerc = 50;
  if (conta.tipo === 'COMUM') {
    if (perfil === 'RAY') {
      minhaPerc = conta.splitRule?.spouse ?? 50;
      parcPerc = conta.splitRule?.me ?? 50;
    } else {
      minhaPerc = conta.splitRule?.me ?? 50;
      parcPerc = conta.splitRule?.spouse ?? 50;
    }
  }

  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 14, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, borderWidth: isDarkMode ? 1 : 0, borderColor: '#334155' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        
        {/* Bloco Esquerdo: Ícone + Textos */}
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }} activeOpacity={0.7} onPress={onPress}>
          <LinearGradient
            colors={gradColors as [string, string]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}
          >
            <Ionicons name={iconName as any} size={20} color="#ffffff" />
          </LinearGradient>
          
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: 'bold', color: colors.text }} numberOfLines={1}>{conta.nome}</Text>
            {conta.tipo === 'COMUM' ? (
              <Text style={{ fontSize: 11, color: colors.subText, marginTop: 2, fontWeight: '500' }}>
                Você: {minhaPerc}% • Parc: {parcPerc}%
              </Text>
            ) : (
              <Text style={{ fontSize: 11, color: colors.subText, marginTop: 2, fontWeight: '500' }}>
                {isReceita ? 'Entrada' : 'Despesa'} {conta.tipo.charAt(0) + conta.tipo.slice(1).toLowerCase()}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Bloco Direito: Valores Compactados */}
        <TouchableOpacity style={{ alignItems: 'flex-end', paddingRight: 10, borderRightWidth: 1, borderRightColor: isDarkMode ? '#334155' : '#f1f5f9', marginRight: 8, justifyContent: 'center' }} activeOpacity={0.7} onPress={onPress}>
          <Text style={{ fontSize: 10, color: colors.subText, marginBottom: 2, fontWeight: '700', textTransform: 'uppercase' }}>
            {isReceita ? 'A Receber' : 'Pendente'}
          </Text>
          <Text style={[{ fontSize: 15, fontWeight: 'bold' }, pendente > 0 ? { color: isReceita ? '#f59e0b' : '#ef4444' } : { color: '#10b981' }]}>
            R$ {pendente.toFixed(2)}
          </Text>
          <Text style={{ fontSize: 10, color: colors.subText, marginTop: 2, fontWeight: '500' }}>
            De R$ {totalFatura.toFixed(2)}
          </Text>
        </TouchableOpacity>

        {/* Opções */}
        <TouchableOpacity style={{ paddingVertical: 8, paddingLeft: 4 }} onPress={onOptionsPress}>
          <Ionicons name="ellipsis-vertical" size={18} color={colors.subText} />
        </TouchableOpacity>
      </View>
    </View>
  );
}