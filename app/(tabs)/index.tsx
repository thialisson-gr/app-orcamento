import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient'; // npx expo install expo-linear-gradient
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// --- DADOS FALSOS (MOCKS) ATUALIZADOS ---
const mockResumo = {
  mesAtual: 'Março 2026',
  
  // Dados da Casa (Divisão)
  totalCasa: 3000.00,
  suaParteCasa: 2010.00, // 67%
  parteRayCasa: 990.00,  // 33%
  
  // Seus Dados Pessoais (Nova Lógica)
  suaReceitaTotal: 5500.00, // Ex: Seu Salário
  seusGastosIndividuais: 450.00, // Seus cartões individuais
  aReceberTerceiros: 250.00, // Dinheiro que não é custo seu
};

// --- CÁLCULOS INTELIGENTES (MOCK) ---
const suasDespesasTotais = mockResumo.suaParteCasa + mockResumo.seusGastosIndividuais;
const seuSaldoRestante = mockResumo.suaReceitaTotal - suasDespesasTotais;
const porcentagemGasta = (suasDespesasTotais / mockResumo.suaReceitaTotal) * 100;

const mockTransacoes = [
  { id: '1', descricao: 'Supermercado', valor: 800.00, tag: 'Alimentação', conta: 'Nubank Comum', data: 'Hoje' },
  { id: '2', descricao: 'TV da Sala (2/12)', valor: 200.00, tag: 'Casa', conta: 'Santander Comum', data: 'Ontem' },
  { id: '3', descricao: 'Tênis João', valor: 250.00, tag: 'Terceiros', conta: 'Card Santander Individual', data: '20 Mar' },
  { id: '4', descricao: 'Salário Março', valor: 5500.00, tag: 'Salário', conta: 'Conta Corrente', data: '01 Mar', tipo: 'RECEITA' },
];

export default function DashboardScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* CABEÇALHO */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá, Você!</Text>
            <Text style={styles.subGreeting}>Aqui está o resumo do mês.</Text>
          </View>
          <TouchableOpacity style={styles.monthSelector}>
            <Text style={styles.monthText}>{mockResumo.mesAtual}</Text>
            <Ionicons name="chevron-down" size={16} color="#3b82f6" />
          </TouchableOpacity>
        </View>

        {/* NOVO SEÇÃO: SEU FLUXO DE CAIXA PESSOAL (Design Premium) */}
        <LinearGradient
          colors={['#1e3a8a', '#3b82f6']} // Gradiente azul moderno
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.personalFlowCard}
        >
          <View style={styles.personalFlowHeader}>
            <Text style={styles.personalFlowTitle}>Seu Saldo Disponível</Text>
            <Ionicons name="eye-outline" size={20} color="rgba(255,255,255,0.7)" />
          </View>
          
          <Text style={styles.personalBalance}>R$ {seuSaldoRestante.toFixed(2)}</Text>
          
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${porcentagemGasta}%` }]} />
          </View>
          <Text style={styles.progressText}>Você já comprometeu {porcentagemGasta.toFixed(0)}% da sua receita.</Text>

          <View style={styles.flowDetailsRow}>
            <View style={styles.flowDetailItem}>
              <Ionicons name="arrow-up-circle" size={18} color="#4ade80" />
              <View>
                <Text style={styles.flowDetailLabel}>Sua Receita</Text>
                <Text style={styles.flowDetailValue}>R$ {mockResumo.suaReceitaTotal.toFixed(2)}</Text>
              </View>
            </View>
            <View style={styles.flowDetailItem}>
              <Ionicons name="arrow-down-circle" size={18} color="#f87171" />
              <View>
                <Text style={styles.flowDetailLabel}>Suas Despesas</Text>
                <Text style={styles.flowDetailValue}>R$ {suasDespesasTotais.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* CARD PRINCIPAL ANTIGO: DESPESAS DA CASA (Ajustado) */}
        <View style={styles.mainCard}>
          <Text style={styles.cardTitle}>Despesas Comuns da Casa</Text>
          <Text style={styles.totalAmount}>R$ {mockResumo.totalCasa.toFixed(2)}</Text>
          
          <View style={styles.splitContainer}>
            <View style={styles.splitItem}>
              <Text style={styles.splitLabel}>Sua Parte (67%)</Text>
              <Text style={styles.splitValue}>R$ {mockResumo.suaParteCasa.toFixed(2)}</Text>
            </View>
            <View style={styles.splitDivider} />
            <View style={styles.splitItem}>
              <Text style={styles.splitLabel}>Parte Ray (33%)</Text>
              <Text style={styles.splitValue}>R$ {mockResumo.parteRayCasa.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* CARDS SECUNDÁRIOS: TERCEIROS */}
        <View style={styles.rowCards}>
          {/* Removido o card individual daqui, pois já está no topo */}
          <View style={[styles.smallCard, { backgroundColor: '#fdf2f8', marginRight: 0 }]}>
            <View style={styles.smallCardHeader}>
                <Text style={styles.smallCardTitle}>A Receber (Terceiros)</Text>
                <Ionicons name="people-outline" size={16} color="#be185d" />
            </View>
            <Text style={[styles.smallCardValue, { color: '#be185d' }]}>R$ {mockResumo.aReceberTerceiros.toFixed(2)}</Text>
          </View>
        </View>

        {/* LISTA DE TRANSAÇÕES RECENTES */}
        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>Transações Recentes</Text>
          
          {mockTransacoes.map((item) => (
            <View key={item.id} style={styles.transactionItem}>
              <View style={[styles.transactionIcon, { backgroundColor: item.tipo === 'RECEITA' ? '#ecfdf5' : '#f3f4f6' }]}>
                <Ionicons 
                    name={item.tipo === 'RECEITA' ? "trending-up" : "cart-outline"} 
                    size={24} 
                    color={item.tipo === 'RECEITA' ? "#10b981" : "#4b5563"} 
                />
              </View>
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionDesc}>{item.descricao}</Text>
                <Text style={styles.transactionMeta}>{item.conta} • {item.tag}</Text>
              </View>
              <View style={styles.transactionRight}>
                <Text style={[styles.transactionAmount, { color: item.tipo === 'RECEITA' ? '#10b981' : '#1f2937' }]}>
                    {item.tipo === 'RECEITA' ? '+' : ''}R$ {item.valor.toFixed(2)}
                </Text>
                <Text style={styles.transactionDate}>{item.data}</Text>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>

      {/* BOTÃO FLUTUANTE (FAB) PARA ADICIONAR DESPESA (Ajustado posição para não cobrir a tab bar) */}
      <TouchableOpacity 
        style={styles.fab} 
        activeOpacity={0.8}
        onPress={() => router.push('/add-transaction')}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

// --- ESTILOS ATUALIZADOS E CORRIGIDOS ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  scrollContent: { padding: 20, paddingBottom: 110 }, 
  // CORREÇÃO AQUI: alignItems: 'flex-start' em vez de 'start'
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, marginTop: 50 },
  greeting: { fontSize: 26, fontWeight: 'bold', color: '#1f2937' },
  subGreeting: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  monthSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#e5e7eb' },
  monthText: { fontSize: 14, color: '#3b82f6', fontWeight: '600', marginRight: 4 },
  
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