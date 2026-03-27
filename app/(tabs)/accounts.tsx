// app/(tabs)/accounts.tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useAccounts } from '../../hooks/useAccounts';
import { useTheme } from '../../hooks/useTheme';
import { useTransactions } from '../../hooks/useTransactions';
import { deletarContaNoFirebase } from '../../services/firebase/firestore';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const FILTROS = [
  { id: 'TODAS', label: 'Todas' },
  { id: 'RECEITA', label: 'Receitas' },
  { id: 'COMUM', label: 'Comuns' },
  { id: 'INDIVIDUAL', label: 'Individuais' },
  { id: 'TERCEIROS', label: 'Terceiros' }
];

export default function AccountsScreen() {
  const { contas, loadingContas } = useAccounts();
  const { transacoes, loading } = useTransactions();
  const { colors, isDarkMode, activeTheme } = useTheme(); 

  const [dataFiltro, setDataFiltro] = useState(new Date());
  const [filtroAtivo, setFiltroAtivo] = useState('TODAS');

  const mesAtual = dataFiltro.getMonth();
  const anoAtual = dataFiltro.getFullYear();
  const mesFormatado = `${MESES[mesAtual]} ${anoAtual}`;

  const irMesAnterior = () => setDataFiltro(new Date(anoAtual, mesAtual - 1, 1));
  const irProximoMes = () => setDataFiltro(new Date(anoAtual, mesAtual + 1, 1));

  const handleOpcoesConta = (conta: any) => Alert.alert('Opções', `Editar ou Excluir?`, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Excluir', style: 'destructive', onPress: () => deletarContaNoFirebase(conta.id) }]);
  const abrirConta = (nome: string) => router.push(`/account/${encodeURIComponent(nome)}`);

  if (loadingContas || loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}><ActivityIndicator size="large" color={colors.accent} /></View>;

  // Lógica de Filtragem e Ordenação
  let contasExibidas = contas;
  if (filtroAtivo !== 'TODAS') {
    contasExibidas = contas.filter(c => c.tipo === filtroAtivo);
  }

  // Ordem prioritária: Receitas (1), Comuns (2), Individuais (3), Terceiros (4)
  const ordemTipo: Record<string, number> = { 'RECEITA': 1, 'COMUM': 2, 'INDIVIDUAL': 3, 'TERCEIROS': 4 };
  contasExibidas.sort((a, b) => ordemTipo[a.tipo] - ordemTipo[b.tipo]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: 16, paddingTop: Platform.OS === 'ios' ? 50 : 40, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: isDarkMode ? '#374151' : '#e5e7eb', alignItems: 'center' }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>Minhas Tabelas</Text>
      </View>
      
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.card, padding: 8, marginHorizontal: 16, marginTop: 16, borderRadius: 12, elevation: 1, borderWidth: isDarkMode ? 1 : 0, borderColor: '#374151' }}>
        <TouchableOpacity onPress={irMesAnterior} style={{ padding: 6, backgroundColor: colors.accentLight, borderRadius: 8 }}><Ionicons name="chevron-back" size={18} color={colors.accent} /></TouchableOpacity>
        <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.text }}>{mesFormatado}</Text>
        <TouchableOpacity onPress={irProximoMes} style={{ padding: 6, backgroundColor: colors.accentLight, borderRadius: 8 }}><Ionicons name="chevron-forward" size={18} color={colors.accent} /></TouchableOpacity>
      </View>

      {/* NOVO: Barra de Filtros */}
      <View style={{ marginTop: 16 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {FILTROS.map(filtro => (
            <TouchableOpacity 
              key={filtro.id} 
              onPress={() => setFiltroAtivo(filtro.id)}
              style={{ paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: filtroAtivo === filtro.id ? colors.accent : (isDarkMode ? '#475569' : '#e2e8f0'), backgroundColor: filtroAtivo === filtro.id ? colors.accentLight : (isDarkMode ? '#1e293b' : '#f8fafc') }}
            >
              <Text style={{ fontSize: 13, fontWeight: filtroAtivo === filtro.id ? 'bold' : '500', color: filtroAtivo === filtro.id ? colors.accent : (isDarkMode ? '#cbd5e1' : '#64748b') }}>{filtro.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {contasExibidas.length === 0 ? (
          <Text style={{ textAlign: 'center', color: colors.subText, marginTop: 20, fontStyle: 'italic' }}>Nenhuma tabela encontrada.</Text>
        ) : (
          contasExibidas.map((conta) => {
            const isReceita = conta.tipo === 'RECEITA';
            const transacoesContaMes = transacoes.filter(t => t.accountId === conta.nome && new Date(t.paymentDate || t.date).getMonth() === mesAtual && new Date(t.paymentDate || t.date).getFullYear() === anoAtual);
            
            const totalFatura = transacoesContaMes.filter(t => t.type === (isReceita ? 'RECEITA' : 'DESPESA')).reduce((acc, t) => acc + t.amount, 0);
            const totalConcluido = transacoesContaMes.filter(t => t.type === (isReceita ? 'RECEITA' : 'DESPESA') && t.isPaid).reduce((acc, t) => acc + t.amount, 0);
            const pendente = totalFatura - totalConcluido;

            let iconName = 'wallet';
            if (conta.tipo === 'COMUM') iconName = 'home';
            if (conta.tipo === 'INDIVIDUAL') iconName = 'person';
            if (conta.tipo === 'TERCEIROS') iconName = 'people';

            return (
              <View key={conta.id} style={{ backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 12, elevation: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: isDarkMode ? '#374151' : '#f1f5f9' }}>
                  <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }} activeOpacity={0.6} onPress={() => abrirConta(conta.nome)}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isReceita ? (isDarkMode ? '#064e3b' : '#ecfdf5') : colors.accentLight, justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name={iconName as any} size={16} color={isReceita ? '#10b981' : colors.accent} />
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: 'bold', color: colors.text }}>{conta.nome}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ padding: 4 }} onPress={() => handleOpcoesConta(conta)}><Ionicons name="ellipsis-horizontal" size={20} color={colors.subText} /></TouchableOpacity>
                </View>
                <TouchableOpacity style={{ flexDirection: 'row', justifyContent: 'space-between' }} activeOpacity={0.6} onPress={() => abrirConta(conta.nome)}>
                  <View style={{ flex: 1 }}><Text style={{ fontSize: 11, color: colors.subText, marginBottom: 2 }}>{isReceita ? 'Total Previsto' : 'Total da Fatura'}</Text><Text style={{ fontSize: 15, fontWeight: 'bold', color: colors.text }}>R$ {totalFatura.toFixed(2)}</Text></View>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}><Text style={{ fontSize: 11, color: colors.subText, marginBottom: 2 }}>{isReceita ? 'A Receber' : 'Pendente'}</Text><Text style={[{ fontSize: 15, fontWeight: 'bold' }, pendente > 0 ? { color: isReceita ? '#f59e0b' : '#ef4444' } : { color: '#10b981' }]}>R$ {pendente.toFixed(2)}</Text></View>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>
      
      <TouchableOpacity style={{ position: 'absolute', bottom: 80, right: 20, width: 52, height: 52, borderRadius: 26, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: colors.accent, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 6 }} activeOpacity={0.8} onPress={() => router.push('/add-account')}>
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}