// app/account/[id].tsx
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAccounts } from '../../hooks/useAccounts';
import { useTheme } from '../../hooks/useTheme'; // 👈 TEMA AQUI
import { useTransactions } from '../../hooks/useTransactions';
import { alternarStatusPagamento, deletarTransacaoDoFirebase, pagarFaturaCompleta } from '../../services/firebase/firestore';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function AccountDetailScreen() {
  const { id } = useLocalSearchParams();
  const nomeConta = id ? decodeURIComponent(id as string) : '';
  const { colors, isDarkMode } = useTheme(); // 👈 PUXANDO CORES

  const { transacoes, loading: loadingTransacoes } = useTransactions();
  const { contas, loadingContas } = useAccounts();

  const [dataFiltro, setDataFiltro] = useState(new Date());
  const mesAtual = dataFiltro.getMonth();
  const anoAtual = dataFiltro.getFullYear();
  const mesFormatado = `${MESES[mesAtual]} ${anoAtual}`;

  const irMesAnterior = () => setDataFiltro(new Date(anoAtual, mesAtual - 1, 1));
  const irProximoMes = () => setDataFiltro(new Date(anoAtual, mesAtual + 1, 1));

  if (loadingTransacoes || loadingContas) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const contaAtual = contas.find(c => c.nome === nomeConta);
  const isReceita = contaAtual?.tipo === 'RECEITA';

  const transacoesDoMes = transacoes.filter(t => {
    if (t.accountId !== nomeConta) return false;
    const dataPag = new Date(t.paymentDate || t.date);
    return dataPag.getMonth() === mesAtual && dataPag.getFullYear() === anoAtual;
  });

  const transacoesPendentes = transacoesDoMes.filter(t => !t.isPaid);
  const transacoesPagas = transacoesDoMes.filter(t => t.isPaid);

  const totalGeral = transacoesDoMes.reduce((acc, t) => acc + t.amount, 0);
  const totalConcluido = transacoesPagas.reduce((acc, t) => acc + t.amount, 0);
  const totalPendente = transacoesPendentes.reduce((acc, t) => acc + t.amount, 0);

  const handleToggleCheck = async (transacaoId: string, statusAtual: boolean) => {
    await alternarStatusPagamento(transacaoId, statusAtual);
  };

  const handleConcluirTudo = async () => {
    if (transacoesPendentes.length === 0) return;
    Alert.alert(
      isReceita ? 'Receber Tudo' : 'Pagar Fatura',
      isReceita ? 'Deseja marcar todas as entradas deste mês como recebidas?' : 'Deseja dar baixa em todas as contas deste mês?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sim, confirmar', onPress: async () => await pagarFaturaCompleta(transacoesPendentes.map(t => t.id)) }
      ]
    );
  };

  const handleExcluir = (item: any) => {
    Alert.alert('Apagar Transação', `Deseja excluir "${item.descricao}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sim, Apagar', style: 'destructive', onPress: () => deletarTransacaoDoFirebase(item.id) }
    ]);
  };

  const formatarData = (dataIso: string) => {
    if (!dataIso) return '';
    return new Date(dataIso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const renderItem = (item: any) => (
    <TouchableOpacity key={item.id} style={[styles.transactionItem, { backgroundColor: colors.card }]} activeOpacity={0.7} onLongPress={() => handleExcluir(item)}>
      <TouchableOpacity style={styles.checkboxArea} onPress={() => handleToggleCheck(item.id, item.isPaid)} activeOpacity={0.6}>
        <View style={[styles.checkbox, { borderColor: isDarkMode ? '#4b5563' : '#d1d5db' }, item.isPaid && (isReceita ? styles.checkboxRecebido : styles.checkboxPago)]}>
          {item.isPaid && <Ionicons name="checkmark" size={16} color="#fff" />}
        </View>
      </TouchableOpacity>
      <View style={styles.transactionDetails}>
        <Text style={[styles.transactionDesc, { color: colors.text }, item.isPaid && styles.textStrikethrough]} numberOfLines={1}>{item.descricao}</Text>
        <Text style={[styles.transactionMeta, { color: colors.subText }]}>{item.tags ? item.tags[0] : ''} {item.isInstallment && `• Parcela ${item.installmentDetails?.current}/${item.installmentDetails?.total}`} {item.isFixed && `• Fixo ${item.fixedDetails?.current}/${item.fixedDetails?.total}`}</Text>
      </View>
      <View style={styles.transactionRight}>
        <Text style={[styles.transactionAmount, { color: colors.text }, item.isPaid && styles.textStrikethroughMuted]}>R$ {item.amount.toFixed(2)}</Text>
        <Text style={[styles.transactionDate, { color: colors.subText }]}>{formatarData(item.paymentDate || item.date)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.compactHeader, { backgroundColor: colors.card, borderBottomColor: isDarkMode ? '#374151' : '#e5e7eb' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{nomeConta}</Text>
          <View style={[styles.miniMonthSelector, { backgroundColor: isDarkMode ? '#111827' : '#f3f4f6' }]}>
            <TouchableOpacity onPress={irMesAnterior} style={styles.miniArrow}><Ionicons name="chevron-back" size={14} color={colors.accent} /></TouchableOpacity>
            <Text style={[styles.miniMonthText, { color: isDarkMode ? '#d1d5db' : '#4b5563' }]}>{mesFormatado}</Text>
            <TouchableOpacity onPress={irProximoMes} style={styles.miniArrow}><Ionicons name="chevron-forward" size={14} color={colors.accent} /></TouchableOpacity>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
          <View style={[styles.summaryHeader, { borderBottomColor: isDarkMode ? '#374151' : '#f3f4f6' }]}>
            <Text style={[styles.summaryTitle, { color: colors.subText }]}>{isReceita ? 'Total Esperado' : 'Total da Fatura'}</Text>
            <Text style={[styles.summaryTotal, { color: colors.text }]}>R$ {totalGeral.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCol}>
              <Text style={[styles.summaryLabel, { color: colors.subText }]}>{isReceita ? 'Já Recebido' : 'Já Pago'}</Text>
              <Text style={[styles.summaryValue, isReceita ? {color: '#10b981'} : {color: colors.accent}]}>R$ {totalConcluido.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryColRight}>
              <Text style={[styles.summaryLabel, { color: colors.subText }]}>Pendente</Text>
              <Text style={[styles.summaryValue, totalPendente > 0 ? (isReceita ? {color: '#f59e0b'} : {color: '#ef4444'}) : {color: colors.subText}]}>
                R$ {totalPendente.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {transacoesPendentes.length > 0 && (
          <View style={styles.listSection}>
            <Text style={[styles.sectionTitle, { color: colors.subText }]}>Pendentes</Text>
            {transacoesPendentes.map(renderItem)}
          </View>
        )}

        {transacoesPagas.length > 0 && (
          <View style={styles.listSection}>
            <Text style={[styles.sectionTitle, { color: colors.subText }]}>{isReceita ? 'Recebidos' : 'Pagos'}</Text>
            {transacoesPagas.map(renderItem)}
          </View>
        )}

        {transacoesDoMes.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name={isReceita ? "wallet-outline" : "receipt-outline"} size={48} color={colors.subText} />
            <Text style={[styles.emptyText, { color: colors.subText }]}>Nenhuma movimentação neste mês.</Text>
          </View>
        )}
      </ScrollView>

      {transacoesPendentes.length > 0 && (
        <View style={[styles.footer, { backgroundColor: isDarkMode ? 'rgba(17,24,39,0.95)' : 'rgba(243,244,246,0.95)' }]}>
          <TouchableOpacity style={[styles.payAllButton, isReceita ? styles.receiveAllButton : { backgroundColor: colors.accent }]} onPress={handleConcluirTudo} activeOpacity={0.8}>
            <Ionicons name="checkmark-done-circle-outline" size={24} color="#fff" />
            <Text style={styles.payAllText}>{isReceita ? 'Receber Tudo' : 'Pagar Fatura Completa'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }, container: { flex: 1 },
  compactHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 50 : 40, paddingBottom: 16, borderBottomWidth: 1 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  miniMonthSelector: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  miniArrow: { paddingHorizontal: 4 }, miniMonthText: { fontSize: 12, fontWeight: 'bold', marginHorizontal: 8 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  summaryCard: { borderRadius: 16, padding: 16, marginBottom: 24, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  summaryHeader: { alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1 },
  summaryTitle: { fontSize: 13, marginBottom: 2 }, summaryTotal: { fontSize: 28, fontWeight: 'bold' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' }, summaryCol: { flex: 1 }, summaryColRight: { flex: 1, alignItems: 'flex-end' },
  summaryLabel: { fontSize: 12, marginBottom: 4 }, summaryValue: { fontSize: 16, fontWeight: 'bold' },
  listSection: { marginBottom: 24 }, sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 12, marginLeft: 4, textTransform: 'uppercase' },
  transactionItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 10 },
  checkboxArea: { width: 36, height: 36, justifyContent: 'center', alignItems: 'flex-start' },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  checkboxPago: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' }, checkboxRecebido: { backgroundColor: '#10b981', borderColor: '#10b981' },
  transactionDetails: { flex: 1 }, transactionDesc: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  transactionMeta: { fontSize: 11 }, transactionRight: { alignItems: 'flex-end' },
  transactionAmount: { fontSize: 15, fontWeight: 'bold', marginBottom: 2 }, transactionDate: { fontSize: 11 },
  textStrikethrough: { textDecorationLine: 'line-through', color: '#6b7280' }, textStrikethroughMuted: { color: '#6b7280' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }, emptyText: { marginTop: 12, fontSize: 14 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20 },
  payAllButton: { flexDirection: 'row', borderRadius: 16, paddingVertical: 14, justifyContent: 'center', alignItems: 'center', gap: 8, elevation: 3 },
  receiveAllButton: { backgroundColor: '#10b981' }, payAllText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});