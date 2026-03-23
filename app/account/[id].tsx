// app/account/[id].tsx
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// --- MOCK DE TRANSAÇÕES ESPECÍFICAS DESTA CONTA ---
const mockExtrato = [
  { id: '1', descricao: 'Netflix', valor: 39.90, data: '15 Mar', tag: 'Assinaturas' },
  { id: '2', descricao: 'Jantar Restaurante', valor: 150.00, data: '14 Mar', tag: 'Lazer' },
  { id: '3', descricao: 'Posto de Gasolina', valor: 200.00, data: '10 Mar', tag: 'Transporte' },
];

export default function AccountDetailsScreen() {
  // O hook useLocalSearchParams captura o ID e o Nome que enviamos na URL
  const { id, nome } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      {/* CABEÇALHO PERSONALIZADO COM BOTÃO DE VOLTAR */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{nome}</Text>
        <View style={{ width: 40 }} /> {/* Espaçador para centralizar o título */}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* RESUMO DO MÊS DESTE CARTÃO */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total da Fatura (Março)</Text>
          <Text style={styles.summaryValue}>R$ 389,90</Text>
        </View>

        <Text style={styles.sectionTitle}>Histórico de Lançamentos</Text>

        {/* LISTA DE DESPESAS DA "TABELA" */}
        {mockExtrato.map((item) => (
          <View key={item.id} style={styles.transactionItem}>
            <View style={styles.transactionLeft}>
              <View style={styles.iconBg}>
                <Ionicons name="receipt-outline" size={20} color="#6b7280" />
              </View>
              <View>
                <Text style={styles.transactionDesc}>{item.descricao}</Text>
                <Text style={styles.transactionTag}>{item.tag} • {item.data}</Text>
              </View>
            </View>
            <Text style={styles.transactionAmount}>R$ {item.valor.toFixed(2)}</Text>
          </View>
        ))}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 50, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  scrollContent: { padding: 20 },
  
  summaryCard: { backgroundColor: '#1e3a8a', borderRadius: 16, padding: 24, marginBottom: 24, alignItems: 'center', shadowColor: '#1e3a8a', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  summaryLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 8 },
  summaryValue: { fontSize: 32, fontWeight: 'bold', color: '#ffffff' },

  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#374151', marginBottom: 16 },
  
  transactionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: 16, borderRadius: 12, marginBottom: 12 },
  transactionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBg: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },
  transactionDesc: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  transactionTag: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  transactionAmount: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
});