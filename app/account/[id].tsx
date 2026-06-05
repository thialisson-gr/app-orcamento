// app/account/[id].tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAccounts } from '../../hooks/useAccounts';
import { useTheme } from '../../hooks/useTheme';
import { useTransactions } from '../../hooks/useTransactions';
import { alternarStatusPagamento, deletarMultiplasTransacoes, deletarTransacaoDoFirebase, pagarFaturaCompleta } from '../../services/firebase/firestore';

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

  const ordenarTransacoes = (a: any, b: any) => {
    const aIsRecorrente = a.isInstallment || a.isFixed ? 1 : 0;
    const bIsRecorrente = b.isInstallment || b.isFixed ? 1 : 0;

    if (aIsRecorrente !== bIsRecorrente) {
      return bIsRecorrente - aIsRecorrente; 
    }

    const dataA = new Date(a.paymentDate || a.date).getTime();
    const dataB = new Date(b.paymentDate || b.date).getTime();
    
    return dataB - dataA;
  };

  const transacoesPendentes = transacoesDoMes.filter(t => !t.isPaid).sort(ordenarTransacoes);
  const transacoesPagas = transacoesDoMes.filter(t => t.isPaid).sort(ordenarTransacoes);

  const totalGeral = transacoesDoMes.reduce((acc, t) => acc + t.amount, 0);
  const totalConcluido = transacoesPagas.reduce((acc, t) => acc + t.amount, 0);
  const totalPendente = transacoesPendentes.reduce((acc, t) => acc + t.amount, 0);

  const handleToggleCheck = async (transacaoId: string, statusAtual: boolean) => {
    if (statusAtual) {
      Alert.alert(
        'Desmarcar Pagamento',
        isReceita ? 'Tem certeza que deseja desmarcar este recebimento?' : 'Tem certeza que deseja desmarcar este pagamento?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Sim, desmarcar', style: 'destructive', onPress: async () => await alternarStatusPagamento(transacaoId, statusAtual) }
        ]
      );
    } else {
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
    const isRecorrente = item.isInstallment || item.isFixed;
    const parentId = item.isInstallment ? item.installmentDetails?.parentId : item.fixedDetails?.parentId;

    Alert.alert('Opções da Transação', `O que deseja fazer com "${item.descricao}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Editar', onPress: () => router.push({ pathname: '/edit-transaction', params: { 
          id: item.id, tipoOriginal: item.type, valorOriginal: item.amount.toString(), descOriginal: item.descricao, contaOriginal: item.accountId, dataOriginal: item.paymentDate || item.date, tagOriginal: item.tags ? item.tags[0] : '', isTerceiroOriginal: item.isForThirdParty ? 'true' : 'false', nomeTerceiroOriginal: item.thirdPartyName || '',
          isRecorrente: isRecorrente ? 'true' : 'false',
          parentId: parentId || ''
        } }) 
      },
      { text: 'Eliminar', style: 'destructive', onPress: () => {
          
          if (isRecorrente && parentId) {
            Alert.alert('Excluir Recorrência', 'Esta transação faz parte de uma assinatura/parcelamento. Deseja apagar apenas esta ou todas as parcelas futuras também?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Apenas Esta', onPress: () => deletarTransacaoDoFirebase(item.id) },
              { text: 'Esta e Futuras', style: 'destructive', onPress: () => {
                  const dataReferencia = new Date(item.paymentDate || item.date).getTime();
                  const futurasIds = transacoes.filter(t => {
                    const tParentId = t.isInstallment ? t.installmentDetails?.parentId : t.fixedDetails?.parentId;
                    const tData = new Date(t.paymentDate || t.date).getTime();
                    return tParentId === parentId && tData >= dataReferencia;
                  }).map(t => t.id);

                  deletarMultiplasTransacoes(futurasIds);
              }}
            ]);
          } else {
            deletarTransacaoDoFirebase(item.id);
          }

      }}
    ]);
  };

  const formatarData = (dataIso: string) => {
    if (!dataIso) return '';
    return new Date(dataIso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const renderItem = (item: any) => (
    <View key={item.id} style={[styles.transactionItem, { borderBottomColor: isDarkMode ? '#334155' : '#f1f5f9' }]}>
      
      {/* Botão de Check/Bolinha */}
      <TouchableOpacity style={styles.checkboxArea} onPress={() => handleToggleCheck(item.id, item.isPaid)} activeOpacity={0.6}>
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

      {/* 👇 OS TRÊS PONTINHOS VISÍVEIS! */}
      <TouchableOpacity style={styles.optionsArea} onPress={() => handleOpcoesTransacao(item)}>
        <Ionicons name="ellipsis-vertical" size={20} color={colors.subText} />
      </TouchableOpacity>

    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* CABEÇALHO COLORIDO */}
      <LinearGradient colors={gradColors as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerGradient}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}><Ionicons name="arrow-back" size={24} color="#ffffff" /></TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{nomeConta}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* SELETOR DE MÊS (PÍLULA CLARA) */}
        <View style={styles.monthSelectorContainer}>
          <TouchableOpacity onPress={irMesAnterior} style={styles.miniArrow}><Ionicons name="chevron-back" size={16} color="#ffffff" /></TouchableOpacity>
          <Text style={styles.monthText}>{mesFormatado}</Text>
          <TouchableOpacity onPress={irProximoMes} style={styles.miniArrow}><Ionicons name="chevron-forward" size={16} color="#ffffff" /></TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* CARTÃO DE RESUMO DA FATURA (SQUIRCLE) */}
        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: isDarkMode ? '#334155' : 'transparent', borderWidth: isDarkMode ? 1 : 0 }]}>
          <View style={styles.cardInfoRow}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
               <Ionicons name={isReceita ? "wallet-outline" : "receipt-outline"} size={16} color={colors.subText}/>
               <Text style={[styles.cardLabelMain, { color: colors.subText }]}>{isReceita ? 'Total Esperado' : 'Total da Fatura'}</Text>
            </View>
            <Text style={[styles.cardValueMain, { color: colors.text }]}>R$ {totalGeral.toFixed(2)}</Text>
          </View>

          <View style={styles.cardStatsGrid}>
            <View style={styles.statItem}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4}}>
                <Ionicons name="checkmark-circle" size={14} color={corPrincipal} />
                <Text style={[styles.statItemLabel, {color: colors.subText, marginBottom: 0}]}>{isReceita ? 'Recebido' : 'Pago'}</Text>
              </View>
              <Text style={[styles.statItemValue, {color: corPrincipal}]}>R$ {totalConcluido.toFixed(2)}</Text>
            </View>
            
            <View style={{ width: 1, backgroundColor: isDarkMode ? '#334155' : '#f1f5f9', marginHorizontal: 12 }} />
            
            <View style={[styles.statItem, {alignItems: 'flex-end'}]}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4, justifyContent: 'flex-end'}}>
                <Ionicons name="alert-circle" size={14} color={totalPendente > 0 ? "#ef4444" : colors.subText} />
                <Text style={[styles.statItemLabel, {color: colors.subText, marginBottom: 0}]}>Pendente</Text>
              </View>
              <Text style={[styles.statItemValue, totalPendente > 0 ? { color: '#ef4444' } : { color: colors.subText }]}>R$ {totalPendente.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* LISTAS DE TRANSAÇÕES */}
        {transacoesPendentes.length > 0 && (
          <View style={styles.listSection}>
            <Text style={[styles.sectionTitle, { color: colors.subText }]}>Pendentes</Text>
            <View style={[styles.listContainer, { backgroundColor: colors.card, borderColor: isDarkMode ? '#334155' : 'transparent', borderWidth: isDarkMode ? 1 : 0 }]}>
              {transacoesPendentes.map(renderItem)}
            </View>
          </View>
        )}

        {transacoesPagas.length > 0 && (
          <View style={styles.listSection}>
            <Text style={[styles.sectionTitle, { color: colors.subText }]}>{isReceita ? 'Recebidos' : 'Pagos'}</Text>
            <View style={[styles.listContainer, { backgroundColor: colors.card, borderColor: isDarkMode ? '#334155' : 'transparent', borderWidth: isDarkMode ? 1 : 0 }]}>
              {transacoesPagas.map(renderItem)}
            </View>
          </View>
        )}

        {transacoesDoMes.length === 0 && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconCircle, { backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9' }]}>
              <Ionicons name={isReceita ? "wallet-outline" : "receipt-outline"} size={36} color={colors.subText} />
            </View>
            <Text style={[styles.emptyText, { color: colors.subText }]}>Nenhuma movimentação neste mês.</Text>
          </View>
        )}
      </ScrollView>

      {/* BOTÃO FAB FLUTUANTE (SQUIRCLE) */}
      <TouchableOpacity 
        style={[styles.fabCompact, { backgroundColor: corPrincipal, bottom: transacoesPendentes.length > 0 ? 100 : 30 }]} 
        activeOpacity={0.8} 
        onPress={() => router.push({ pathname: '/add-transaction', params: { contaPreSelecionada: nomeConta } })}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* BOTÃO PAGAR TUDO NO RODAPÉ */}
      {transacoesPendentes.length > 0 && (
        <View style={[styles.footerSlim, { backgroundColor: isDarkMode ? 'rgba(18,18,20,0.95)' : 'rgba(244,244,245,0.95)' }]}>
          <TouchableOpacity style={[styles.payAllButtonSlim, { backgroundColor: corPrincipal }]} onPress={handleConcluirTudo} activeOpacity={0.8}>
            <Ionicons name="checkmark-done" size={20} color="#fff" />
            <Text style={styles.payAllTextSlim}>{isReceita ? 'Receber Tudo' : 'Pagar Fatura Completa'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }, 
  container: { flex: 1 },
  
  headerGradient: { paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 24, paddingHorizontal: 20 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#ffffff', flex: 1, textAlign: 'center' },
  
  monthSelectorContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', borderRadius: 30, paddingHorizontal: 16, paddingVertical: 8 },
  miniArrow: { paddingHorizontal: 8 }, 
  monthText: { fontSize: 14, fontWeight: 'bold', color: '#ffffff', marginHorizontal: 12 },
  
  scrollContent: { padding: 20, paddingBottom: 120 },
  
  summaryCard: { marginTop: -40, borderRadius: 24, padding: 24, marginBottom: 24, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
  cardInfoRow: { marginBottom: 20, alignItems: 'center' }, 
  cardLabelMain: { fontSize: 13, marginBottom: 6, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }, 
  cardValueMain: { fontSize: 34, fontWeight: '800' },
  cardStatsGrid: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 16 },
  statItem: { flex: 1 }, 
  statItemLabel: { fontSize: 12, marginBottom: 4, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }, 
  statItemValue: { fontSize: 18, fontWeight: 'bold' },
  
  listSection: { marginBottom: 24 }, 
  sectionTitle: { fontSize: 13, fontWeight: 'bold', marginBottom: 12, marginLeft: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  listContainer: { borderRadius: 20, paddingHorizontal: 16, overflow: 'hidden', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
  
  transactionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
  checkboxArea: { width: 36, height: 36, justifyContent: 'center', alignItems: 'flex-start' }, 
  checkbox: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  transactionDetails: { flex: 1, paddingRight: 8 }, 
  transactionDesc: { fontSize: 15, fontWeight: '600', marginBottom: 2 }, 
  transactionMeta: { fontSize: 12 },
  transactionRight: { alignItems: 'flex-end', justifyContent: 'center' }, 
  transactionAmount: { fontSize: 15, fontWeight: 'bold', marginBottom: 2 }, 
  
  // OS 3 PONTINHOS
  optionsArea: { paddingLeft: 12, paddingVertical: 10, justifyContent: 'center', alignItems: 'flex-end' },
  
  textStrikethrough: { textDecorationLine: 'line-through', color: '#94a3b8' }, 
  textStrikethroughMuted: { color: '#94a3b8' },
  
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }, 
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 }, 
  emptyText: { fontSize: 15, fontWeight: '500' },
  
  footerSlim: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: Platform.OS === 'ios' ? 30 : 20 },
  payAllButtonSlim: { flexDirection: 'row', borderRadius: 20, paddingVertical: 18, justifyContent: 'center', alignItems: 'center', gap: 10, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 6 }, 
  payAllTextSlim: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  
  fabCompact: { position: 'absolute', right: 24, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 6, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, zIndex: 10 },
});