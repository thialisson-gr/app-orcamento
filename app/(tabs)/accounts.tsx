// app/(tabs)/accounts.tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAccounts } from '../../hooks/useAccounts';
import { useTransactions } from '../../hooks/useTransactions';

export default function AccountsScreen() {
  const { contas, loadingContas } = useAccounts();
  const { transacoes } = useTransactions(); // Trazemos as transações para calcular a fatura de cada cartão

  // Função inteligente que soma as despesas para uma tabela específica
  const calcularTotalConta = (nomeConta: string) => {
    return transacoes
      .filter((t) => t.accountId === nomeConta && t.type === 'DESPESA')
      .reduce((soma, t) => soma + t.amount, 0);
  };

  // Função para formatar o texto da regra visualmente
  const formatarRegra = (conta: any) => {
    if (conta.tipo === 'COMUM') return `${conta.splitRule.me}% Você / ${conta.splitRule.spouse}% Ray`;
    if (conta.tipo === 'INDIVIDUAL') return `100% ${conta.dono === 'EU' ? 'Sua' : 'da Ray'}`;
    if (conta.tipo === 'TERCEIROS') return `100% Terceiros`;
    return 'Regra não definida';
  };

  // Função para dar uma cor diferente a cada tipo de conta
  const obterCorConta = (tipo: string) => {
    switch (tipo) {
      case 'COMUM': return '#8b5cf6'; // Roxo
      case 'INDIVIDUAL': return '#0ea5e9'; // Azul
      case 'TERCEIROS': return '#ec4899'; // Rosa
      default: return '#10b981'; // Verde
    }
  };

  if (loadingContas) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ marginTop: 10, color: '#6b7280' }}>A carregar tabelas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Minhas Tabelas</Text>
        <Text style={styles.subtitle}>Gerencie os seus cartões e regras de divisão</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {contas.length === 0 ? (
          <Text style={{ textAlign: 'center', color: '#6b7280', marginTop: 40 }}>
            Ainda não criou nenhuma tabela.
          </Text>
        ) : (
          contas.map((conta) => (
            <TouchableOpacity 
              key={conta.id} 
              style={styles.card}
              activeOpacity={0.7}
              onPress={() => router.push({
                pathname: '/account/[id]',
                params: { id: conta.id, nome: conta.nome }
              })}
            >
              <View style={[styles.colorBar, { backgroundColor: obterCorConta(conta.tipo) }]} />
              <View style={styles.cardContent}>
                <View>
                  <Text style={styles.cardName}>{conta.nome}</Text>
                  <Text style={styles.cardRule}>Regra: {formatarRegra(conta)}</Text>
                </View>
                <View style={styles.cardRight}>
                  <Text style={styles.cardTotal}>R$ {calcularTotalConta(conta.nome).toFixed(2)}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* BOTÃO FLUTUANTE PARA ADICIONAR NOVA TABELA */}
      <TouchableOpacity 
        style={styles.fab} 
        activeOpacity={0.8}
        onPress={() => router.push('/add-account')}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { padding: 24, paddingTop: 60, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  scrollContent: { padding: 20, paddingBottom: 120 },
  
  card: { flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: 16, marginBottom: 16, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  colorBar: { width: 8, height: '100%' },
  cardContent: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  cardName: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 },
  cardRule: { fontSize: 12, color: '#6b7280' },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardTotal: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },

  fab: { position: 'absolute', bottom: 100, right: 24, width: 64, height: 64, borderRadius: 32, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5, zIndex: 10 },
});