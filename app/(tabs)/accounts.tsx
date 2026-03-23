// app/(tabs)/accounts.tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAccounts } from '../../hooks/useAccounts';
import { useTransactions } from '../../hooks/useTransactions';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function AccountsScreen() {
  const { contas, loadingContas } = useAccounts();
  const { transacoes, loading } = useTransactions();

  // --- ESTADO DO MÊS SELECIONADO ---
  const [dataFiltro, setDataFiltro] = useState(new Date());
  const mesAtual = dataFiltro.getMonth();
  const anoAtual = dataFiltro.getFullYear();
  const mesFormatado = `${MESES[mesAtual]} ${anoAtual}`;

  const irMesAnterior = () => setDataFiltro(new Date(anoAtual, mesAtual - 1, 1));
  const irProximoMes = () => setDataFiltro(new Date(anoAtual, mesAtual + 1, 1));

  if (loadingContas || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* CABEÇALHO */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Minhas Tabelas</Text>
      </View>

      {/* NAVEGAÇÃO DE MESES */}
      <View style={styles.monthSelectorContainer}>
        <TouchableOpacity onPress={irMesAnterior} style={styles.monthArrow} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={20} color="#3b82f6" />
        </TouchableOpacity>
        <Text style={styles.monthTextBig}>{mesFormatado}</Text>
        <TouchableOpacity onPress={irProximoMes} style={styles.monthArrow} activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={20} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {contas.length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma tabela criada ainda.</Text>
        ) : (
          contas.map((conta) => {
            // 1. Filtra as transações para pegar SÓ as desta conta e DESTE mês específico
            const transacoesContaMes = transacoes.filter(t => {
              if (t.accountId !== conta.nome) return false;
              const dataPag = new Date(t.paymentDate || t.date);
              return dataPag.getMonth() === mesAtual && dataPag.getFullYear() === anoAtual;
            });

            // 2. Soma o total da fatura deste mês
            const totalFaturaMes = transacoesContaMes
              .filter(t => t.type === 'DESPESA')
              .reduce((acc, t) => acc + t.amount, 0);

            // 3. Soma o que já foi marcado como pago neste mês
            const totalPagoMes = transacoesContaMes
              .filter(t => t.type === 'DESPESA' && t.isPaid)
              .reduce((acc, t) => acc + t.amount, 0);

            const pendente = totalFaturaMes - totalPagoMes;

            return (
              <TouchableOpacity
                key={conta.id}
                style={styles.accountCard}
                activeOpacity={0.8}
                onPress={() => router.push(`/account/${conta.nome}`)}
              >
                <View style={styles.accountHeader}>
                  <View style={styles.accountTitleRow}>
                    <View style={styles.iconBox}>
                      <Ionicons name={conta.tipo === 'COMUM' ? 'home' : 'person'} size={20} color="#3b82f6" />
                    </View>
                    <Text style={styles.accountName}>{conta.nome}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
                </View>

                <View style={styles.accountBody}>
                  <View style={styles.amountCol}>
                    <Text style={styles.amountLabel}>Total da Fatura</Text>
                    <Text style={styles.amountValue}>R$ {totalFaturaMes.toFixed(2)}</Text>
                  </View>
                  <View style={styles.amountColRight}>
                    <Text style={styles.amountLabel}>Pendente</Text>
                    <Text style={[styles.amountValue, pendente > 0 ? { color: '#ef4444' } : { color: '#10b981' }]}>
                      R$ {pendente.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Botão de adicionar nova tabela (se houver a rota criada) */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={() => router.push('/add-account')}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { padding: 20, paddingTop: 50, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
  
  monthSelectorContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: 12, marginHorizontal: 20, marginTop: 20, borderRadius: 16, elevation: 2 },
  monthArrow: { padding: 8, backgroundColor: '#eff6ff', borderRadius: 8 },
  monthTextBig: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },

  scrollContent: { padding: 20, paddingBottom: 120 },
  emptyText: { textAlign: 'center', color: '#6b7280', marginTop: 20 },
  
  accountCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20, marginBottom: 16, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
  accountHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  accountTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
  accountName: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  
  accountBody: { flexDirection: 'row', justifyContent: 'space-between' },
  amountCol: { flex: 1 },
  amountColRight: { flex: 1, alignItems: 'flex-end' },
  amountLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  amountValue: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },

  fab: { position: 'absolute', bottom: 100, right: 24, width: 64, height: 64, borderRadius: 32, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', elevation: 5 },
});