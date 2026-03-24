// app/(tabs)/accounts.tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAccounts } from '../../hooks/useAccounts';
import { useTransactions } from '../../hooks/useTransactions';
import { deletarContaNoFirebase } from '../../services/firebase/firestore'; // 👈 Importamos a função nova!

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function AccountsScreen() {
  const { contas, loadingContas } = useAccounts();
  const { transacoes, loading } = useTransactions();

  const [dataFiltro, setDataFiltro] = useState(new Date());
  const mesAtual = dataFiltro.getMonth();
  const anoAtual = dataFiltro.getFullYear();
  const mesFormatado = `${MESES[mesAtual]} ${anoAtual}`;

  const irMesAnterior = () => setDataFiltro(new Date(anoAtual, mesAtual - 1, 1));
  const irProximoMes = () => setDataFiltro(new Date(anoAtual, mesAtual + 1, 1));

  // --- FUNÇÕES DE OPÇÕES DA TABELA ---
  const handleOpcoesConta = (conta: any) => {
    Alert.alert(
      'Opções da Tabela',
      `O que deseja fazer com "${conta.nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Editar Nome/Regras', 
          onPress: () => Alert.alert('Em breve', 'A tela de edição será nosso próximo passo!') 
        },
        { 
          text: 'Excluir Tabela', 
          style: 'destructive', 
          onPress: () => confirmarExclusao(conta) 
        }
      ]
    );
  };

  const confirmarExclusao = (conta: any) => {
    Alert.alert(
      'Atenção MÁXIMA!',
      `Tem certeza que deseja excluir "${conta.nome}"? Ela sumirá desta tela. (As transações antigas continuarão no seu histórico geral).`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sim, Excluir', 
          style: 'destructive', 
          onPress: async () => {
            await deletarContaNoFirebase(conta.id);
          } 
        }
      ]
    );
  };

  if (loadingContas || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const contasReceita = contas.filter(c => c.tipo === 'RECEITA');
  const contasDespesa = contas.filter(c => c.tipo !== 'RECEITA');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Minhas Tabelas</Text>
      </View>

      <View style={styles.monthSelectorContainer}>
        <TouchableOpacity onPress={irMesAnterior} style={styles.monthArrow} activeOpacity={0.7}><Ionicons name="chevron-back" size={20} color="#3b82f6" /></TouchableOpacity>
        <Text style={styles.monthTextBig}>{mesFormatado}</Text>
        <TouchableOpacity onPress={irProximoMes} style={styles.monthArrow} activeOpacity={0.7}><Ionicons name="chevron-forward" size={20} color="#3b82f6" /></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* SESSÃO DE RECEITAS */}
        {contasReceita.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cofres & Entradas</Text>
            {contasReceita.map((conta) => {
              const transacoesContaMes = transacoes.filter(t => t.accountId === conta.nome && new Date(t.paymentDate || t.date).getMonth() === mesAtual && new Date(t.paymentDate || t.date).getFullYear() === anoAtual);
              const totalPrevisto = transacoesContaMes.filter(t => t.type === 'RECEITA').reduce((acc, t) => acc + t.amount, 0);
              const totalRecebido = transacoesContaMes.filter(t => t.type === 'RECEITA' && t.isPaid).reduce((acc, t) => acc + t.amount, 0);
              const aReceber = totalPrevisto - totalRecebido;

              return (
                <View key={conta.id} style={styles.accountCard}>
                  <View style={styles.accountHeader}>
                    {/* Botão invisível 1: Abre a conta clicando no nome/ícone */}
                    <TouchableOpacity style={styles.accountTitleRow} activeOpacity={0.6} onPress={() => router.push(`/account/${conta.nome}`)}>
                      <View style={[styles.iconBox, { backgroundColor: '#ecfdf5' }]}><Ionicons name="wallet" size={20} color="#10b981" /></View>
                      <Text style={styles.accountName}>{conta.nome}</Text>
                    </TouchableOpacity>
                    {/* 👈 O NOVO BOTÃO DE OPÇÕES AQUI */}
                    <TouchableOpacity style={styles.optionsBtn} onPress={() => handleOpcoesConta(conta)} activeOpacity={0.5}>
                      <Ionicons name="ellipsis-horizontal" size={24} color="#9ca3af" />
                    </TouchableOpacity>
                  </View>
                  {/* Botão invisível 2: Abre a conta clicando nos valores */}
                  <TouchableOpacity style={styles.accountBody} activeOpacity={0.6} onPress={() => router.push(`/account/${conta.nome}`)}>
                    <View style={styles.amountCol}><Text style={styles.amountLabel}>Total Previsto</Text><Text style={styles.amountValue}>R$ {totalPrevisto.toFixed(2)}</Text></View>
                    <View style={styles.amountColRight}><Text style={styles.amountLabel}>A Receber (Pendente)</Text><Text style={[styles.amountValue, aReceber > 0 ? { color: '#f59e0b' } : { color: '#10b981' }]}>R$ {aReceber.toFixed(2)}</Text></View>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* SESSÃO DE DESPESAS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Faturas & Gastos</Text>
          {contasDespesa.length === 0 ? (
            <Text style={styles.emptyText}>Nenhuma tabela de despesa criada.</Text>
          ) : (
            contasDespesa.map((conta) => {
              const transacoesContaMes = transacoes.filter(t => t.accountId === conta.nome && new Date(t.paymentDate || t.date).getMonth() === mesAtual && new Date(t.paymentDate || t.date).getFullYear() === anoAtual);
              const totalFaturaMes = transacoesContaMes.filter(t => t.type === 'DESPESA').reduce((acc, t) => acc + t.amount, 0);
              const totalPagoMes = transacoesContaMes.filter(t => t.type === 'DESPESA' && t.isPaid).reduce((acc, t) => acc + t.amount, 0);
              const pendente = totalFaturaMes - totalPagoMes;

              return (
                <View key={conta.id} style={styles.accountCard}>
                  <View style={styles.accountHeader}>
                    {/* Botão invisível 1: Abre a conta clicando no nome/ícone */}
                    <TouchableOpacity style={styles.accountTitleRow} activeOpacity={0.6} onPress={() => router.push(`/account/${conta.nome}`)}>
                      <View style={styles.iconBox}><Ionicons name={conta.tipo === 'COMUM' ? 'home' : 'person'} size={20} color="#3b82f6" /></View>
                      <Text style={styles.accountName}>{conta.nome}</Text>
                    </TouchableOpacity>
                    {/* 👈 O NOVO BOTÃO DE OPÇÕES AQUI */}
                    <TouchableOpacity style={styles.optionsBtn} onPress={() => handleOpcoesConta(conta)} activeOpacity={0.5}>
                      <Ionicons name="ellipsis-horizontal" size={24} color="#9ca3af" />
                    </TouchableOpacity>
                  </View>
                  {/* Botão invisível 2: Abre a conta clicando nos valores */}
                  <TouchableOpacity style={styles.accountBody} activeOpacity={0.6} onPress={() => router.push(`/account/${conta.nome}`)}>
                    <View style={styles.amountCol}><Text style={styles.amountLabel}>Total da Fatura</Text><Text style={styles.amountValue}>R$ {totalFaturaMes.toFixed(2)}</Text></View>
                    <View style={styles.amountColRight}><Text style={styles.amountLabel}>Para Pagar (Pendente)</Text><Text style={[styles.amountValue, pendente > 0 ? { color: '#ef4444' } : { color: '#10b981' }]}>R$ {pendente.toFixed(2)}</Text></View>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>

      </ScrollView>

      <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={() => router.push('/add-account')}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }, container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { padding: 20, paddingTop: 50, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
  monthSelectorContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: 12, marginHorizontal: 20, marginTop: 20, borderRadius: 16, elevation: 2 },
  monthArrow: { padding: 8, backgroundColor: '#eff6ff', borderRadius: 8 }, monthTextBig: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  scrollContent: { padding: 20, paddingBottom: 120 },
  section: { marginBottom: 24 }, sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#6b7280', marginBottom: 16, marginLeft: 4 },
  emptyText: { textAlign: 'center', color: '#6b7280', marginTop: 10, fontStyle: 'italic' },
  
  accountCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20, marginBottom: 16, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
  accountHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  accountTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
  accountName: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  
  // Estilo do botão de 3 pontinhos para ter uma área de clique fácil
  optionsBtn: { padding: 4, marginLeft: 8 },
  
  accountBody: { flexDirection: 'row', justifyContent: 'space-between' },
  amountCol: { flex: 1 }, amountColRight: { flex: 1, alignItems: 'flex-end' },
  amountLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4 }, amountValue: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  fab: { position: 'absolute', bottom: 100, right: 24, width: 64, height: 64, borderRadius: 32, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', elevation: 5 },
});