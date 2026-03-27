// app/account/[id].tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAccounts } from '../../hooks/useAccounts';
import { useTheme } from '../../hooks/useTheme';
import { useTransactions } from '../../hooks/useTransactions';
import { alternarStatusPagamento, deletarTransacaoDoFirebase, pagarFaturaCompleta } from '../../services/firebase/firestore';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function AccountDetailScreen() {
  const { id } = useLocalSearchParams();
  const nomeConta = id ? decodeURIComponent(id as string) : '';
  const { colors, isDarkMode } = useTheme(); 

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

  let gradColors = colors.gradient;
  let corPrincipal = colors.accent;
  
  if (isReceita) {
    gradColors = ['#10b981', '#059669'];
    corPrincipal = '#10b981';
  } else if (contaAtual?.tipo === 'INDIVIDUAL') {
    gradColors = ['#3b82f6', '#2563eb'];
    corPrincipal = '#3b82f6';
  } else if (contaAtual?.tipo === 'TERCEIROS') {
    gradColors = ['#f43f5e', '#e11d48'];
    corPrincipal = '#f43f5e';
  }

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

  // 👇 AQUI ESTÁ A TRAVA DE SEGURANÇA QUE VOCÊ PEDIU
  const handleToggleCheck = async (transacaoId: string, statusAtual: boolean) => {
    if (statusAtual) {
      // Se a conta JÁ ESTÁ PAGA, pergunta antes de desmarcar
      Alert.alert(
        'Desmarcar Pagamento',
        isReceita ? 'Tem certeza que deseja desmarcar este recebimento?' : 'Tem certeza que deseja desmarcar este pagamento?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Sim, desmarcar', style: 'destructive', onPress: async () => await alternarStatusPagamento(transacaoId, statusAtual) }
        ]
      );
    } else {
      // Se a conta ESTÁ PENDENTE, paga direto
      await alternarStatusPagamento(transacaoId, statusAtual);
    }
  };

  const handleConcluirTudo = async () => {
    if (transacoesPendentes.length === 0) return;
    Alert.alert(
      isReceita ? 'Receber Tudo' : 'Pagar Fatura',
      isReceita ? 'Deseja marcar todas as entradas deste mês como recebidas?' : 'Deseja dar baixa em todas as contas deste mês?',
      [{ text: 'Cancelar', style: 'cancel' }, { text: 'Sim, confirmar', onPress: async () => await pagarFaturaCompleta(transacoesPendentes.map(t => t.id)) }]
    );
  };

  const handleOpcoesTransacao = (item: any) => {
    Alert.alert('Opções', `"${item.descricao}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Editar', onPress: () => router.push({ pathname: '/edit-transaction', params: { id: item.id, tipoOriginal: item.type, valorOriginal: item.amount.toString(), descOriginal: item.descricao, contaOriginal: item.accountId, dataOriginal: item.paymentDate || item.date, tagOriginal: item.tags ? item.tags[0] : '', isTerceiroOriginal: item.isForThirdParty ? 'true' : 'false', nomeTerceiroOriginal: item.thirdPartyName || '' } }) },
      { text: 'Eliminar', style: 'destructive', onPress: () => deletarTransacaoDoFirebase(item.id) }
    ]);
  };

  const formatarData = (dataIso: string) => {
    if (!dataIso) return '';
    return new Date(dataIso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const renderItem = (item: any) => (
    <TouchableOpacity key={item.id} style={[styles.transactionItem, { backgroundColor: colors.card, borderColor: isDarkMode ? '#334155' : 'transparent', borderWidth: isDarkMode ? 1 : 0 }]} activeOpacity={0.7} onLongPress={() => handleOpcoesTransacao(item)}>
      <TouchableOpacity style={styles.checkboxArea} onPress={() => handleToggleCheck(item.id, item.isPaid)} activeOpacity={0.6}>
        <View style={[styles.checkbox, { borderColor: isDarkMode ? '#4b5563' : '#cbd5e1' }, item.isPaid && { backgroundColor: corPrincipal, borderColor: corPrincipal }]}>
          {item.isPaid && <Ionicons name="checkmark" size={16} color="#fff" />}
        </View>
      </TouchableOpacity>
      <View style={styles.transactionDetails}>
        <Text style={[styles.transactionDesc, { color: colors.text }, item.isPaid && styles.textStrikethrough]} numberOfLines={1}>{item.descricao}</Text>
        <Text style={[styles.transactionMeta, { color: colors.subText }]}>{item.tags ? item.tags[0] : ''} {item.isInstallment && `${item.installmentDetails?.current}/${item.installmentDetails?.total}`}</Text>
      </View>
      <View style={styles.transactionRight}>
        <Text style={[styles.transactionAmount, { color: colors.text }, item.isPaid && styles.textStrikethroughMuted]}>R$ {item.amount.toFixed(2)}</Text>
        
        {item.isPaid ? (
          <View style={{ alignItems: 'flex-end', marginTop: 2 }}>
            <Text style={{ fontSize: 9, color: colors.subText }}>
              {isReceita ? 'Previsto:' : 'Venc:'} {formatarData(item.paymentDate || item.date)}
            </Text>
            <Text style={{ fontSize: 10, color: corPrincipal, fontWeight: '700', marginTop: 1 }}>
              {item.paidAt ? `${isReceita ? 'Recebido:' : 'Pago:'} ${formatarData(item.paidAt)}` : (isReceita ? 'Recebido' : 'Pago')}
            </Text>
          </View>
        ) : (
          <Text style={{ fontSize: 10, color: colors.subText, marginTop: 2 }}>
            {isReceita ? 'Previsto:' : 'Vence:'} {formatarData(item.paymentDate || item.date)}
          </Text>
        )}

      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient 
        colors={gradColors as [string, string]} 
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} 
        style={styles.headerGradientSlim}
      >
        <View style={styles.headerTopRowCompact}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitleSlim} numberOfLines={1}>{nomeConta}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.monthSelectorContainerSlim}>
          <TouchableOpacity onPress={irMesAnterior} style={styles.miniArrow}><Ionicons name="chevron-back" size={16} color="#ffffff" /></TouchableOpacity>
          <Text style={styles.monthTextSlim}>{mesFormatado}</Text>
          <TouchableOpacity onPress={irProximoMes} style={styles.miniArrow}><Ionicons name="chevron-forward" size={16} color="#ffffff" /></TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContentSlim} showsVerticalScrollIndicator={false}>
        
        <View style={[styles.summaryCardCompact, { backgroundColor: colors.card, borderColor: isDarkMode ? '#334155' : 'transparent', borderWidth: isDarkMode ? 1 : 0 }]}>
          <View style={styles.cardInfoRow}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
               <Ionicons name={isReceita ? "wallet-outline" : "receipt-outline"} size={14} color={colors.subText}/>
               <Text style={[styles.cardLabelMain, { color: colors.subText }]}>{isReceita ? 'Total Esperado' : 'Total Fatura'}</Text>
            </View>
            <Text style={[styles.cardValueMain, { color: colors.text }]}>R$ {totalGeral.toFixed(2)}</Text>
          </View>

          <View style={styles.cardStatsGrid}>
            <View style={styles.statItem}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2}}>
                <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                <Text style={[styles.statItemLabel, {color: colors.subText, marginBottom: 0}]}>{isReceita ? 'Recebido' : 'Pago'}</Text>
              </View>
              <Text style={[styles.statItemValue, {color: '#10b981'}]}>R$ {totalConcluido.toFixed(2)}</Text>
            </View>
            <View style={[styles.statItem, {alignItems: 'flex-end'}]}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2, justifyContent: 'flex-end'}}>
                <Ionicons name="alert-circle" size={14} color={totalPendente > 0 ? "#ef4444" : colors.subText} />
                <Text style={[styles.statItemLabel, {color: colors.subText, marginBottom: 0}]}>Pendente</Text>
              </View>
              <Text style={[styles.statItemValue, totalPendente > 0 ? { color: '#ef4444' } : { color: colors.subText }]}>
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
            <View style={[styles.emptyIconCircle, { backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9' }]}>
              <Ionicons name={isReceita ? "wallet-outline" : "receipt-outline"} size={36} color={colors.subText} />
            </View>
            <Text style={[styles.emptyText, { color: colors.subText }]}>Nenhuma movimentação.</Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity 
        style={[styles.fabCompact, { backgroundColor: corPrincipal, bottom: transacoesPendentes.length > 0 ? 90 : 20 }]} 
        activeOpacity={0.8} 
        onPress={() => router.push({ pathname: '/add-transaction', params: { contaPreSelecionada: nomeConta } })}
      >
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>

      {transacoesPendentes.length > 0 && (
        <View style={[styles.footerSlim, { backgroundColor: isDarkMode ? 'rgba(15,23,42,0.95)' : 'rgba(248,250,252,0.95)' }]}>
          <TouchableOpacity style={[styles.payAllButtonSlim, { backgroundColor: corPrincipal }]} onPress={handleConcluirTudo} activeOpacity={0.8}>
            <Ionicons name="checkmark-done" size={20} color="#fff" />
            <Text style={styles.payAllTextSlim}>{isReceita ? 'Receber Tudo' : 'Pagar Fatura'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }, container: { flex: 1 },
  headerGradientSlim: { paddingTop: Platform.OS === 'ios' ? 50 : 40, paddingBottom: 25, paddingHorizontal: 16 },
  headerTopRowCompact: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitleSlim: { fontSize: 18, fontWeight: 'bold', color: '#ffffff', flex: 1, textAlign: 'center' },
  monthSelectorContainerSlim: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'center', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5 },
  miniArrow: { paddingHorizontal: 6 }, monthTextSlim: { fontSize: 13, fontWeight: 'bold', color: '#ffffff', marginHorizontal: 8 },
  scrollContentSlim: { padding: 16, paddingBottom: 110 },
  summaryCardCompact: { marginTop: -25, borderRadius: 16, padding: 16, marginBottom: 20, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6 },
  cardInfoRow: { marginBottom: 16, alignItems: 'center' }, cardLabelMain: { fontSize: 12, marginBottom: 2, fontWeight: '500' }, cardValueMain: { fontSize: 28, fontWeight: 'bold' },
  cardStatsGrid: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 12 },
  statItem: { flex: 1 }, statItemLabel: { fontSize: 11, marginBottom: 2, fontWeight: '500' }, statItemValue: { fontSize: 16, fontWeight: 'bold' },
  listSection: { marginBottom: 20 }, sectionTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 10, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  transactionItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 8 },
  checkboxArea: { width: 36, height: 36, justifyContent: 'center', alignItems: 'flex-start' }, checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  transactionDetails: { flex: 1, paddingRight: 8 }, transactionDesc: { fontSize: 14, fontWeight: '600', marginBottom: 2 }, transactionMeta: { fontSize: 11 },
  transactionRight: { alignItems: 'flex-end' }, transactionAmount: { fontSize: 14, fontWeight: 'bold', marginBottom: 2 }, 
  textStrikethrough: { textDecorationLine: 'line-through', color: '#94a3b8' }, textStrikethroughMuted: { color: '#94a3b8' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }, emptyIconCircle: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 12 }, emptyText: { fontSize: 14, fontWeight: '500' },
  footerSlim: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: Platform.OS === 'ios' ? 24 : 16 },
  payAllButtonSlim: { flexDirection: 'row', borderRadius: 12, paddingVertical: 14, justifyContent: 'center', alignItems: 'center', gap: 8, elevation: 2 }, payAllTextSlim: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },
  fabCompact: { position: 'absolute', right: 16, width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 5, zIndex: 10 },
});