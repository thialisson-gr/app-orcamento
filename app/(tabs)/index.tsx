// app/(tabs)/index.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAccounts } from '../../hooks/useAccounts';
import { useTransactions } from '../../hooks/useTransactions';
import { deletarTransacaoDoFirebase } from '../../services/firebase/firestore';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function DashboardScreen() {
  const { transacoes, loading: loadingTransacoes } = useTransactions();
  const { contas, loadingContas } = useAccounts();

  // --- ESTADO DO MÊS SELECIONADO ---
  const [dataFiltro, setDataFiltro] = useState(new Date());
  const mesAtual = dataFiltro.getMonth();
  const anoAtual = dataFiltro.getFullYear();
  const mesFormatado = `${MESES[mesAtual]} ${anoAtual}`;

  const irMesAnterior = () => setDataFiltro(new Date(anoAtual, mesAtual - 1, 1));
  const irProximoMes = () => setDataFiltro(new Date(anoAtual, mesAtual + 1, 1));

  // --- CÁLCULOS INTELIGENTES (O SEU PLANEJAMENTO DO MÊS) ---
  let totalDespesasConjuntas = 0;
  let suaParteConjunta = 0;
  let parteRayConjunta = 0;
  let seusGastosIndividuais = 0;
  let aReceberTerceiros = 0;
  let suaReceitaTotal = 0;

  transacoes.forEach((t) => {
    const dataPag = new Date(t.paymentDate || t.date);
    
    // Filtra apenas o que pertence ao mês selecionado na tela
    const pertenceAoMes = dataPag.getMonth() === mesAtual && dataPag.getFullYear() === anoAtual;
    if (!pertenceAoMes) return;

    if (t.type === 'RECEITA') {
      suaReceitaTotal += t.amount;
      return; 
    } 

    if (t.isForThirdParty) {
      aReceberTerceiros += t.amount;
      return;
    }

    const conta = contas.find((c) => c.nome === t.accountId);

    if (conta) {
      if (conta.tipo === 'TERCEIROS') {
        aReceberTerceiros += t.amount;
      } else if (conta.tipo === 'COMUM') {
        totalDespesasConjuntas += t.amount;
        // 👇 Removemos a trava do "isPaid". Agora ele mostra o planejamento total do mês!
        suaParteConjunta += t.amount * (conta.splitRule.me / 100);
        parteRayConjunta += t.amount * (conta.splitRule.spouse / 100);
      } else if (conta.tipo === 'INDIVIDUAL' && conta.dono === 'EU') {
        // 👇 Removemos a trava do "isPaid".
        seusGastosIndividuais += t.amount; 
      }
    }
  });

  const suasDespesasTotais = suaParteConjunta + seusGastosIndividuais;
  const seuSaldoRestante = suaReceitaTotal - suasDespesasTotais;
  const porcentagemGasta = suaReceitaTotal > 0 ? (suasDespesasTotais / suaReceitaTotal) * 100 : 0;

  // --- AGRUPAR PARCELADAS E FIXAS NA LISTA RECENTE ---
  const transacoesRecentes: any[] = [];
  const parentIdsVistos = new Set();

  transacoes.forEach((t) => {
    if (t.isInstallment && t.installmentDetails?.parentId) {
      if (!parentIdsVistos.has(t.installmentDetails.parentId)) {
        parentIdsVistos.add(t.installmentDetails.parentId);
        const valorTotal = t.amount * t.installmentDetails.total;
        const nomeLimpo = t.descricao.split(' (')[0];
        transacoesRecentes.push({
          ...t,
          descricao: `${nomeLimpo} (Em ${t.installmentDetails.total}x)`,
          amount: valorTotal,
          dateParaExibir: t.purchaseDate || t.date 
        });
      }
    } 
    else if (t.isFixed && t.fixedDetails?.parentId) {
      if (!parentIdsVistos.has(t.fixedDetails.parentId)) {
        parentIdsVistos.add(t.fixedDetails.parentId);
        transacoesRecentes.push({
          ...t,
          descricao: `${t.descricao} (${t.fixedDetails.current}/${t.fixedDetails.total})`,
          dateParaExibir: t.purchaseDate || t.date
        });
      }
    } 
    else {
      transacoesRecentes.push({
        ...t,
        dateParaExibir: t.purchaseDate || t.date
      });
    }
  });

  // 👇 MUDANÇA 1: Força a ordenação pegando o milissegundo exato em que foi salva!
  transacoesRecentes.sort((a, b) => {
    const tempoA = new Date(a.dateParaExibir).getTime();
    const tempoB = new Date(b.dateParaExibir).getTime();
    return tempoB - tempoA; 
  });

  const ultimasTransacoes = transacoesRecentes.slice(0, 15);

  // 👇 MUDANÇA 2: Agora formata mostrando a Hora também
  const formatarDataHora = (dataIso: string) => {
    if (!dataIso) return '';
    const data = new Date(dataIso);
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' às ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  if (loadingTransacoes || loadingContas) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ marginTop: 10, color: '#6b7280' }}>Calculando finanças...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* CABEÇALHO */}
        <View style={styles.header}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.greeting}>Olá!</Text>
            <Text style={styles.subGreeting}>Aqui está o resumo do mês.</Text>
          </View>
          
          <View style={styles.monthSelector}>
            <TouchableOpacity onPress={irMesAnterior} style={{ padding: 4 }}>
              <Ionicons name="chevron-back" size={20} color="#3b82f6" />
            </TouchableOpacity>
            
            <Text style={styles.monthText}>{mesFormatado}</Text>
            
            <TouchableOpacity onPress={irProximoMes} style={{ padding: 4 }}>
              <Ionicons name="chevron-forward" size={20} color="#3b82f6" />
            </TouchableOpacity>
          </View>
        </View>

        {/* CARD: FLUXO DE CAIXA PESSOAL */}
        <LinearGradient colors={['#1e3a8a', '#3b82f6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.personalFlowCard}>
          <View style={styles.personalFlowHeader}>
            <Text style={styles.personalFlowTitle}>Previsão de Saldo do Mês</Text>
            <Ionicons name="eye-outline" size={20} color="rgba(255,255,255,0.7)" />
          </View>
          <Text style={styles.personalBalance}>R$ {seuSaldoRestante.toFixed(2)}</Text>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${Math.min(porcentagemGasta, 100)}%` }]} />
          </View>
          <Text style={styles.progressText}>Você já comprometeu {porcentagemGasta.toFixed(0)}% da sua receita prevista.</Text>

          <View style={styles.flowDetailsRow}>
            <View style={styles.flowDetailItem}>
              <Ionicons name="arrow-up-circle" size={18} color="#4ade80" />
              <View>
                <Text style={styles.flowDetailLabel}>Receita Prevista</Text>
                <Text style={styles.flowDetailValue}>R$ {suaReceitaTotal.toFixed(2)}</Text>
              </View>
            </View>
            <View style={styles.flowDetailItem}>
              <Ionicons name="arrow-down-circle" size={18} color="#f87171" />
              <View>
                <Text style={styles.flowDetailLabel}>Despesas Previstas</Text>
                <Text style={styles.flowDetailValue}>R$ {suasDespesasTotais.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.mainCard}>
          <Text style={styles.cardTitle}>Despesas Conjuntas ({MESES[mesAtual]})</Text>
          <Text style={styles.totalAmount}>R$ {totalDespesasConjuntas.toFixed(2)}</Text>
          <View style={styles.splitContainer}>
            <View style={styles.splitItem}>
              <Text style={styles.splitLabel}>Sua Parte</Text>
              <Text style={styles.splitValue}>R$ {suaParteConjunta.toFixed(2)}</Text>
            </View>
            <View style={styles.splitDivider} />
            <View style={styles.splitItem}>
              <Text style={styles.splitLabel}>Parte Ray</Text>
              <Text style={styles.splitValue}>R$ {parteRayConjunta.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.rowCards}>
          <View style={[styles.smallCard, { backgroundColor: '#fdf2f8', marginRight: 8 }]}>
            <View style={styles.smallCardHeader}>
                <Text style={styles.smallCardTitle}>A Receber</Text>
                <Ionicons name="people-outline" size={16} color="#be185d" />
            </View>
            <Text style={[styles.smallCardValue, { color: '#be185d' }]}>R$ {aReceberTerceiros.toFixed(2)}</Text>
          </View>
          <View style={[styles.smallCard, { backgroundColor: '#f0f9ff' }]}>
            <View style={styles.smallCardHeader}>
                <Text style={styles.smallCardTitle}>Individual</Text>
                <Ionicons name="person-outline" size={16} color="#0369a1" />
            </View>
            <Text style={[styles.smallCardValue, { color: '#0369a1' }]}>R$ {seusGastosIndividuais.toFixed(2)}</Text>
          </View>
        </View>

        {/* LISTA DE TRANSAÇÕES GERAIS */}
        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>Transações Recentes</Text>
          
          {ultimasTransacoes.length === 0 ? (
            <Text style={{ color: '#6b7280', textAlign: 'center', marginTop: 20 }}>Nenhuma transação registrada ainda.</Text>
          ) : (
            ultimasTransacoes.map((item: any) => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.transactionItem}
                activeOpacity={0.7}
                onLongPress={() => {
                  Alert.alert(
                    'Apagar Transação',
                    `Deseja excluir "${item.descricao}" no valor de R$ ${item.amount.toFixed(2)}?`,
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      { 
                        text: 'Sim, Apagar', 
                        style: 'destructive', 
                        onPress: () => deletarTransacaoDoFirebase(item.id) 
                      }
                    ]
                  );
                }}
              >
                <View style={[styles.transactionIcon, { backgroundColor: item.type === 'RECEITA' ? '#ecfdf5' : '#f3f4f6' }]}>
                  <Ionicons name={item.type === 'RECEITA' ? "trending-up" : "cart-outline"} size={24} color={item.type === 'RECEITA' ? "#10b981" : "#4b5563"} />
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionDesc} numberOfLines={1}>{item.descricao}</Text>
                  <Text style={styles.transactionMeta}>{item.accountId} • {item.tags ? item.tags[0] : ''}</Text>
                </View>
                <View style={styles.transactionRight}>
                  <Text style={[styles.transactionAmount, { color: item.type === 'RECEITA' ? '#10b981' : '#1f2937' }]}>
                      {item.type === 'RECEITA' ? '+' : ''}R$ {item.amount.toFixed(2)}
                  </Text>
                  <Text style={styles.transactionDate}>{formatarDataHora(item.dateParaExibir)}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

      </ScrollView>

      <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={() => router.push('/add-transaction')}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  scrollContent: { padding: 20, paddingBottom: 110 }, 
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 50 },
  greeting: { fontSize: 26, fontWeight: 'bold', color: '#1f2937' },
  subGreeting: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  monthSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: '#e5e7eb' },
  monthText: { fontSize: 14, color: '#3b82f6', fontWeight: 'bold', marginHorizontal: 4, width: 95, textAlign: 'center' },
  
  personalFlowCard: { borderRadius: 24, padding: 24, marginBottom: 20, elevation: 5, shadowColor: '#1e3a8a', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15 },
  personalFlowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  personalFlowTitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  personalBalance: { fontSize: 36, fontWeight: 'bold', color: '#ffffff', marginBottom: 16 },
  progressBarBackground: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, marginBottom: 8 },
  progressBarFill: { height: 8, backgroundColor: '#ffffff', borderRadius: 4 },
  progressText: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 20 },
  flowDetailsRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 16 },
  flowDetailItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flowDetailLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  flowDetailValue: { fontSize: 16, fontWeight: 'bold', color: '#ffffff' },

  mainCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20, elevation: 2, marginBottom: 16 },
  cardTitle: { fontSize: 14, color: '#6b7280', marginBottom: 8 },
  totalAmount: { fontSize: 28, fontWeight: 'bold', color: '#1f2937', marginBottom: 20 },
  splitContainer: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f9fafb', borderRadius: 12, padding: 16 },
  splitItem: { flex: 1 },
  splitLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  splitValue: { fontSize: 16, fontWeight: '700', color: '#374151' },
  splitDivider: { width: 1, backgroundColor: '#e5e7eb', marginHorizontal: 16 },
  
  rowCards: { flexDirection: 'row', marginBottom: 24 },
  smallCard: { flex: 1, borderRadius: 16, padding: 16 },
  smallCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  smallCardTitle: { fontSize: 13, color: '#6b7280' },
  smallCardValue: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  
  transactionsSection: { marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 16 },
  transactionItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 16, borderRadius: 12, marginBottom: 12 },
  transactionIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  transactionDetails: { flex: 1 },
  transactionDesc: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 4 },
  transactionMeta: { fontSize: 12, color: '#6b7280' },
  transactionRight: { alignItems: 'flex-end' },
  transactionAmount: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  transactionDate: { fontSize: 12, color: '#9ca3af' },

  fab: { position: 'absolute', bottom: 100, right: 24, width: 64, height: 64, borderRadius: 32, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5, zIndex: 10 },
});