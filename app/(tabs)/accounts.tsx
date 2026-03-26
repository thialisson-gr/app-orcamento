// app/(tabs)/accounts.tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useAccounts } from '../../hooks/useAccounts';
import { useTheme } from '../../hooks/useTheme'; // 👈 IMPORT
import { useTransactions } from '../../hooks/useTransactions';
import { deletarContaNoFirebase } from '../../services/firebase/firestore';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function AccountsScreen() {
  const { contas, loadingContas } = useAccounts();
  const { transacoes, loading } = useTransactions();
  const { colors, isDarkMode } = useTheme(); // 👈 TEMA AQUI!

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
      <View style={{ padding: 20, paddingTop: 50, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: isDarkMode ? '#374151' : '#e5e7eb' }}><Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text }}>Minhas Tabelas</Text></View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.card, padding: 12, marginHorizontal: 20, marginTop: 20, borderRadius: 16, elevation: 2 }}>
        <TouchableOpacity onPress={irMesAnterior} style={{ padding: 8, backgroundColor: colors.accentLight, borderRadius: 8 }}><Ionicons name="chevron-back" size={20} color={colors.accent} /></TouchableOpacity>
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>{mesFormatado}</Text>
        <TouchableOpacity onPress={irProximoMes} style={{ padding: 8, backgroundColor: colors.accentLight, borderRadius: 8 }}><Ionicons name="chevron-forward" size={20} color={colors.accent} /></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {contasReceita.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.subText, marginBottom: 16, marginLeft: 4 }}>Cofres & Entradas</Text>
            {contasReceita.map((conta) => {
              const transacoesContaMes = transacoes.filter(t => t.accountId === conta.nome && new Date(t.paymentDate || t.date).getMonth() === mesAtual && new Date(t.paymentDate || t.date).getFullYear() === anoAtual);
              const totalPrevisto = transacoesContaMes.filter(t => t.type === 'RECEITA').reduce((acc, t) => acc + t.amount, 0);
              const totalRecebido = transacoesContaMes.filter(t => t.type === 'RECEITA' && t.isPaid).reduce((acc, t) => acc + t.amount, 0);
              const aReceber = totalPrevisto - totalRecebido;

              return (
                <View key={conta.id} style={{ backgroundColor: colors.card, borderRadius: 16, padding: 20, marginBottom: 16, elevation: 3 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: isDarkMode ? '#374151' : '#f3f4f6' }}>
                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }} activeOpacity={0.6} onPress={() => abrirConta(conta.nome)}>
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDarkMode ? '#064e3b' : '#ecfdf5', justifyContent: 'center', alignItems: 'center' }}><Ionicons name="wallet" size={20} color="#10b981" /></View>
                      <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>{conta.nome}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ padding: 4, marginLeft: 8 }} onPress={() => handleOpcoesConta(conta)}><Ionicons name="ellipsis-horizontal" size={24} color={colors.subText} /></TouchableOpacity>
                  </View>
                  <TouchableOpacity style={{ flexDirection: 'row', justifyContent: 'space-between' }} activeOpacity={0.6} onPress={() => abrirConta(conta.nome)}>
                    <View style={{ flex: 1 }}><Text style={{ fontSize: 12, color: colors.subText, marginBottom: 4 }}>Total Previsto</Text><Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>R$ {totalPrevisto.toFixed(2)}</Text></View>
                    <View style={{ flex: 1, alignItems: 'flex-end' }}><Text style={{ fontSize: 12, color: colors.subText, marginBottom: 4 }}>A Receber</Text><Text style={[{ fontSize: 18, fontWeight: 'bold' }, aReceber > 0 ? { color: '#f59e0b' } : { color: '#10b981' }]}>R$ {aReceber.toFixed(2)}</Text></View>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.subText, marginBottom: 16, marginLeft: 4 }}>Faturas & Gastos</Text>
          {contasDespesa.length === 0 ? <Text style={{ textAlign: 'center', color: colors.subText, marginTop: 10, fontStyle: 'italic' }}>Nenhuma tabela de despesa criada.</Text> : (
            contasDespesa.map((conta) => {
              const transacoesContaMes = transacoes.filter(t => t.accountId === conta.nome && new Date(t.paymentDate || t.date).getMonth() === mesAtual && new Date(t.paymentDate || t.date).getFullYear() === anoAtual);
              const totalFaturaMes = transacoesContaMes.filter(t => t.type === 'DESPESA').reduce((acc, t) => acc + t.amount, 0);
              const totalPagoMes = transacoesContaMes.filter(t => t.type === 'DESPESA' && t.isPaid).reduce((acc, t) => acc + t.amount, 0);
              const pendente = totalFaturaMes - totalPagoMes;

              return (
                <View key={conta.id} style={{ backgroundColor: colors.card, borderRadius: 16, padding: 20, marginBottom: 16, elevation: 3 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: isDarkMode ? '#374151' : '#f3f4f6' }}>
                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }} activeOpacity={0.6} onPress={() => abrirConta(conta.nome)}>
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accentLight, justifyContent: 'center', alignItems: 'center' }}><Ionicons name={conta.tipo === 'COMUM' ? 'home' : 'person'} size={20} color={colors.accent} /></View>
                      <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>{conta.nome}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ padding: 4, marginLeft: 8 }} onPress={() => handleOpcoesConta(conta)}><Ionicons name="ellipsis-horizontal" size={24} color={colors.subText} /></TouchableOpacity>
                  </View>
                  <TouchableOpacity style={{ flexDirection: 'row', justifyContent: 'space-between' }} activeOpacity={0.6} onPress={() => abrirConta(conta.nome)}>
                    <View style={{ flex: 1 }}><Text style={{ fontSize: 12, color: colors.subText, marginBottom: 4 }}>Total da Fatura</Text><Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>R$ {totalFaturaMes.toFixed(2)}</Text></View>
                    <View style={{ flex: 1, alignItems: 'flex-end' }}><Text style={{ fontSize: 12, color: colors.subText, marginBottom: 4 }}>Pendente</Text><Text style={[{ fontSize: 18, fontWeight: 'bold' }, pendente > 0 ? { color: '#ef4444' } : { color: '#10b981' }]}>R$ {pendente.toFixed(2)}</Text></View>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
      <TouchableOpacity style={{ position: 'absolute', bottom: 100, right: 24, width: 64, height: 64, borderRadius: 32, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center', elevation: 5 }} activeOpacity={0.8} onPress={() => router.push('/add-account')}><Ionicons name="add" size={32} color="#fff" /></TouchableOpacity>
    </View>
  );
}