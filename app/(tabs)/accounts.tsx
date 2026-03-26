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

export default function AccountsScreen() {
  const { contas, loadingContas } = useAccounts();
  const { transacoes, loading } = useTransactions();
  const { colors, isDarkMode } = useTheme(); 

  const [dataFiltro, setDataFiltro] = useState(new Date());
  const mesAtual = dataFiltro.getMonth();
  const anoAtual = dataFiltro.getFullYear();
  const mesFormatado = `${MESES[mesAtual]} ${anoAtual}`;

  const irMesAnterior = () => setDataFiltro(new Date(anoAtual, mesAtual - 1, 1));
  const irProximoMes = () => setDataFiltro(new Date(anoAtual, mesAtual + 1, 1));

  const handleOpcoesConta = (conta: any) => Alert.alert('Opções', `Editar ou Excluir?`, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Excluir', style: 'destructive', onPress: () => deletarContaNoFirebase(conta.id) }]);
  const abrirConta = (nome: string) => router.push(`/account/${encodeURIComponent(nome)}`);

  if (loadingContas || loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}><ActivityIndicator size="large" color={colors.accent} /></View>;

  const contasReceita = contas.filter(c => c.tipo === 'RECEITA');
  const contasDespesa = contas.filter(c => c.tipo !== 'RECEITA');

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

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {contasReceita.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.subText, marginBottom: 12, marginLeft: 4 }}>Cofres & Entradas</Text>
            {contasReceita.map((conta) => {
              const transacoesContaMes = transacoes.filter(t => t.accountId === conta.nome && new Date(t.paymentDate || t.date).getMonth() === mesAtual && new Date(t.paymentDate || t.date).getFullYear() === anoAtual);
              const totalPrevisto = transacoesContaMes.filter(t => t.type === 'RECEITA').reduce((acc, t) => acc + t.amount, 0);
              const totalRecebido = transacoesContaMes.filter(t => t.type === 'RECEITA' && t.isPaid).reduce((acc, t) => acc + t.amount, 0);
              const aReceber = totalPrevisto - totalRecebido;

              return (
                <View key={conta.id} style={{ backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 12, elevation: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: isDarkMode ? '#374151' : '#f1f5f9' }}>
                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }} activeOpacity={0.6} onPress={() => abrirConta(conta.nome)}>
                      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isDarkMode ? '#064e3b' : '#ecfdf5', justifyContent: 'center', alignItems: 'center' }}><Ionicons name="wallet" size={16} color="#10b981" /></View>
                      <Text style={{ fontSize: 15, fontWeight: 'bold', color: colors.text }}>{conta.nome}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ padding: 4 }} onPress={() => handleOpcoesConta(conta)}><Ionicons name="ellipsis-horizontal" size={20} color={colors.subText} /></TouchableOpacity>
                  </View>
                  <TouchableOpacity style={{ flexDirection: 'row', justifyContent: 'space-between' }} activeOpacity={0.6} onPress={() => abrirConta(conta.nome)}>
                    <View style={{ flex: 1 }}><Text style={{ fontSize: 11, color: colors.subText, marginBottom: 2 }}>Previsto</Text><Text style={{ fontSize: 15, fontWeight: 'bold', color: colors.text }}>R$ {totalPrevisto.toFixed(2)}</Text></View>
                    <View style={{ flex: 1, alignItems: 'flex-end' }}><Text style={{ fontSize: 11, color: colors.subText, marginBottom: 2 }}>A Receber</Text><Text style={[{ fontSize: 15, fontWeight: 'bold' }, aReceber > 0 ? { color: '#f59e0b' } : { color: '#10b981' }]}>R$ {aReceber.toFixed(2)}</Text></View>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.subText, marginBottom: 12, marginLeft: 4 }}>Faturas & Gastos</Text>
          {contasDespesa.length === 0 ? <Text style={{ textAlign: 'center', color: colors.subText, marginTop: 10, fontSize: 13, fontStyle: 'italic' }}>Nenhuma tabela criada.</Text> : (
            contasDespesa.map((conta) => {
              const transacoesContaMes = transacoes.filter(t => t.accountId === conta.nome && new Date(t.paymentDate || t.date).getMonth() === mesAtual && new Date(t.paymentDate || t.date).getFullYear() === anoAtual);
              const totalFaturaMes = transacoesContaMes.filter(t => t.type === 'DESPESA').reduce((acc, t) => acc + t.amount, 0);
              const totalPagoMes = transacoesContaMes.filter(t => t.type === 'DESPESA' && t.isPaid).reduce((acc, t) => acc + t.amount, 0);
              const pendente = totalFaturaMes - totalPagoMes;

              return (
                <View key={conta.id} style={{ backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 12, elevation: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: isDarkMode ? '#374151' : '#f1f5f9' }}>
                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }} activeOpacity={0.6} onPress={() => abrirConta(conta.nome)}>
                      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.accentLight, justifyContent: 'center', alignItems: 'center' }}><Ionicons name={conta.tipo === 'COMUM' ? 'home' : 'person'} size={16} color={colors.accent} /></View>
                      <Text style={{ fontSize: 15, fontWeight: 'bold', color: colors.text }}>{conta.nome}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ padding: 4 }} onPress={() => handleOpcoesConta(conta)}><Ionicons name="ellipsis-horizontal" size={20} color={colors.subText} /></TouchableOpacity>
                  </View>
                  <TouchableOpacity style={{ flexDirection: 'row', justifyContent: 'space-between' }} activeOpacity={0.6} onPress={() => abrirConta(conta.nome)}>
                    <View style={{ flex: 1 }}><Text style={{ fontSize: 11, color: colors.subText, marginBottom: 2 }}>Total da Fatura</Text><Text style={{ fontSize: 15, fontWeight: 'bold', color: colors.text }}>R$ {totalFaturaMes.toFixed(2)}</Text></View>
                    <View style={{ flex: 1, alignItems: 'flex-end' }}><Text style={{ fontSize: 11, color: colors.subText, marginBottom: 2 }}>Pendente</Text><Text style={[{ fontSize: 15, fontWeight: 'bold' }, pendente > 0 ? { color: '#ef4444' } : { color: '#10b981' }]}>R$ {pendente.toFixed(2)}</Text></View>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
      
      {/* Botão Menor e Mais Discreto */}
      <TouchableOpacity style={{ position: 'absolute', bottom: 80, right: 20, width: 52, height: 52, borderRadius: 26, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: colors.accent, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 6 }} activeOpacity={0.8} onPress={() => router.push('/add-account')}>
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}