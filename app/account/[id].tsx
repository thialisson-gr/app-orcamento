// app/account/[id].tsx
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTransactions } from '../../hooks/useTransactions';
import { alternarStatusPagamento, pagarFaturaCompleta } from '../../services/firebase/firestore';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function AccountDetailsScreen() {
  const { nome } = useLocalSearchParams();
  const { transacoes, loading } = useTransactions();

  // --- ESTADO DO MÊS SELECIONADO ---
  const [dataFiltro, setDataFiltro] = useState(new Date());
  const mesAtual = dataFiltro.getMonth();
  const anoAtual = dataFiltro.getFullYear();
  const mesFormatado = `${MESES[mesAtual]} ${anoAtual}`;

  const irMesAnterior = () => setDataFiltro(new Date(anoAtual, mesAtual - 1, 1));
  const irProximoMes = () => setDataFiltro(new Date(anoAtual, mesAtual + 1, 1));

  // --- FILTRO: APENAS TRANSAÇÕES DA TABELA + DO MÊS SELECIONADO ---
  const extratoDoMes = transacoes.filter((t) => {
    const dataPag = new Date(t.paymentDate || t.date);
    const pertenceAoMes = dataPag.getMonth() === mesAtual && dataPag.getFullYear() === anoAtual;
    return t.accountId === nome && pertenceAoMes;
  });

  // Calcula quanto da Fatura DESSE MÊS ainda não foi pago
  const despesasPendentes = extratoDoMes.filter((t) => t.type === 'DESPESA' && !t.isPaid);
  const totalPendente = despesasPendentes.reduce((soma, t) => soma + t.amount, 0);

  const formatarData = (dataIso: string) => {
    if (!dataIso) return '';
    const data = new Date(dataIso);
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const handlePagarTudo = async () => {
    if (despesasPendentes.length === 0) return Alert.alert('Aviso', 'Não há despesas pendentes nesta fatura.');
    
    Alert.alert('Confirmar Pagamento', `Deseja dar baixa em todas as despesas pendentes (R$ ${totalPendente.toFixed(2)}) da fatura de ${mesFormatado}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sim, Pagar Fatura', onPress: async () => {
          const idsPendentes = despesasPendentes.map(t => t.id);
          await pagarFaturaCompleta(idsPendentes);
        }
      }
    ]);
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>;
  }

  return (
    <View style={styles.container}>
      {/* CABEÇALHO */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{nome}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* NAVEGAÇÃO DE MESES */}
        <View style={styles.monthSelectorContainer}>
          <TouchableOpacity onPress={irMesAnterior} style={styles.monthArrow}>
            <Ionicons name="chevron-back" size={20} color="#3b82f6" />
          </TouchableOpacity>
          <Text style={styles.monthTextBig}>{mesFormatado}</Text>
          <TouchableOpacity onPress={irProximoMes} style={styles.monthArrow}>
            <Ionicons name="chevron-forward" size={20} color="#3b82f6" />
          </TouchableOpacity>
        </View>

        {/* RESUMO E BOTÃO DE PAGAR */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Pendente da Fatura</Text>
          <Text style={styles.summaryValue}>R$ {totalPendente.toFixed(2)}</Text>
          <TouchableOpacity 
            style={[styles.payAllButton, totalPendente === 0 && { backgroundColor: '#93c5fd' }]} 
            onPress={handlePagarTudo}
            disabled={totalPendente === 0}
          >
            <Ionicons name="checkmark-done" size={20} color="#fff" />
            <Text style={styles.payAllText}>Pagar Fatura do Mês</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Lançamentos de {MESES[mesAtual]}</Text>

        {extratoDoMes.length === 0 ? (
          <Text style={{ textAlign: 'center', color: '#6b7280' }}>Fatura zerada neste mês.</Text>
        ) : (
          extratoDoMes.map((item) => (
            <View key={item.id} style={[styles.transactionItem, item.isPaid && { opacity: 0.6 }]}>
              <View style={styles.transactionLeft}>
                <TouchableOpacity 
                  style={[styles.checkbox, item.isPaid && styles.checkboxPaid]} 
                  onPress={() => alternarStatusPagamento(item.id, item.isPaid)}
                >
                  {item.isPaid && <Ionicons name="checkmark" size={16} color="#ffffff" />}
                </TouchableOpacity>
                <View>
                  <Text style={[styles.transactionDesc, item.isPaid && { textDecorationLine: 'line-through' }]}>
                    {item.descricao}
                  </Text>
                  <Text style={styles.transactionTag}>{item.tags ? item.tags[0] : ''} • Venc: {formatarData(item.paymentDate || item.date)}</Text>
                </View>
              </View>
              <Text style={styles.transactionAmount}>R$ {item.amount.toFixed(2)}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 50, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  scrollContent: { padding: 20 },
  
  monthSelectorContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: 12, borderRadius: 16, marginBottom: 20, elevation: 2 },
  monthArrow: { padding: 8, backgroundColor: '#eff6ff', borderRadius: 8 },
  monthTextBig: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },

  summaryCard: { backgroundColor: '#1e3a8a', borderRadius: 16, padding: 24, marginBottom: 24, alignItems: 'center', elevation: 5 },
  summaryLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 8 },
  summaryValue: { fontSize: 32, fontWeight: 'bold', color: '#ffffff', marginBottom: 16 },
  payAllButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3b82f6', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, gap: 8 },
  payAllText: { color: '#ffffff', fontWeight: 'bold' },

  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#374151', marginBottom: 16 },
  
  transactionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: 16, borderRadius: 12, marginBottom: 12 },
  transactionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#d1d5db', justifyContent: 'center', alignItems: 'center' },
  checkboxPaid: { backgroundColor: '#10b981', borderColor: '#10b981' },
  transactionDesc: { fontSize: 15, fontWeight: '600', color: '#1f2937', paddingRight: 10 },
  transactionTag: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  transactionAmount: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
});