// app/(tabs)/accounts.tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// --- DADOS FALSOS (Suas Tabelas) ---
const mockContas = [
  { id: 'nubank-comum', nome: 'Nubank (Comum)', regra: '67% / 33%', totalGasto: 1250.00, cor: '#8b5cf6' },
  { id: 'santander-indiv', nome: 'Santander Individual', regra: '100% Você', totalGasto: 450.00, cor: '#ef4444' },
  { id: 'nubank-ray', nome: 'Nubank Ray', regra: '100% Ray', totalGasto: 320.00, cor: '#db2777' },
  { id: 'recorrentes', nome: 'Recorrentes Casa', regra: '67% / 33%', totalGasto: 1300.00, cor: '#10b981' },
];

export default function AccountsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Minhas Contas e Cartões</Text>
        <Text style={styles.subtitle}>Selecione uma tabela para ver os detalhes</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {mockContas.map((conta) => (
            <TouchableOpacity 
                key={conta.id} 
                style={styles.card}
                activeOpacity={0.7}
                // 👇 Nova sintaxe baseada em objeto para não dar erro no TypeScript
                onPress={() => router.push({
                pathname: '/account/[id]',
                params: { id: conta.id, nome: conta.nome }
                })}
            >
            <View style={[styles.colorBar, { backgroundColor: conta.cor }]} />
            <View style={styles.cardContent}>
              <View>
                <Text style={styles.cardName}>{conta.nome}</Text>
                <Text style={styles.cardRule}>Regra: {conta.regra}</Text>
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.cardTotal}>R$ {conta.totalGasto.toFixed(2)}</Text>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
});