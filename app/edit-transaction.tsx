// app/edit-transaction.tsx
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTransactions } from '../hooks/useTransactions';
import { atualizarTransacaoNoFirebase } from '../services/firebase/firestore';

export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams();
  const { transacoes } = useTransactions();
  
  // Encontra a transação clicada
  const transacaoOriginal = transacoes.find(t => t.id === id);

  const [descricao, setDescricao] = useState(transacaoOriginal?.descricao || '');
  const [valor, setValor] = useState(transacaoOriginal?.amount ? transacaoOriginal.amount.toFixed(2).replace('.', ',') : '');
  const [isLoading, setIsLoading] = useState(false);

  // Se o Firebase ainda estiver carregando, mostra um loading
  if (!transacaoOriginal) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const handleValorChange = (texto: string) => {
    const apenasNumeros = texto.replace(/\D/g, '');
    const valorDecimal = Number(apenasNumeros) / 100;
    if (apenasNumeros === '') return setValor('');
    setValor(valorDecimal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  };

  const handleSalvar = async () => {
    if (!valor || !descricao) return Alert.alert('Atenção', 'O nome e o valor não podem ficar vazios.');

    setIsLoading(true);
    
    // Converte de volta para número do banco (ex: 1.200,50 -> 1200.50)
    const valorLimpo = valor.replace(/\./g, '').replace(',', '.');
    const valorNumerico = parseFloat(valorLimpo);

    const resultado = await atualizarTransacaoNoFirebase(id as string, {
      descricao,
      amount: valorNumerico
    });

    setIsLoading(false);

    if (resultado.sucesso) {
      router.back();
    } else {
      Alert.alert('Erro', 'Não foi possível atualizar a transação.');
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.compactHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="close" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Transação</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#3b82f6" />
          <Text style={styles.infoText}>Você está editando apenas esta transação específica.</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Descrição</Text>
          <TextInput style={styles.input} value={descricao} onChangeText={setDescricao} />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Valor (R$)</Text>
          <TextInput 
            style={[styles.input, { fontSize: 24, fontWeight: 'bold' }]} 
            keyboardType="numeric" 
            value={valor} 
            onChangeText={handleValorChange} 
          />
        </View>

      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.saveButton, isLoading && {opacity: 0.7}]} onPress={handleSalvar} activeOpacity={0.8} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Salvar Correção</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#ffffff' },
  compactHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 50 : 40, paddingBottom: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  content: { padding: 20 },
  infoBox: { flexDirection: 'row', backgroundColor: '#eff6ff', padding: 16, borderRadius: 12, marginBottom: 24, alignItems: 'center', gap: 10 },
  infoText: { flex: 1, color: '#1e3a8a', fontSize: 13, lineHeight: 18 },
  formGroup: { marginBottom: 24 }, 
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }, 
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 16, fontSize: 16, color: '#1f2937' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, borderTopWidth: 1, borderTopColor: '#f3f4f6', backgroundColor: '#ffffff' }, 
  saveButton: { backgroundColor: '#3b82f6', borderRadius: 16, paddingVertical: 18, alignItems: 'center' }, 
  saveButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});