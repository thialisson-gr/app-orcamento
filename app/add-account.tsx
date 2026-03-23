// app/add-account.tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { salvarContaNoFirebase } from '../services/firebase/firestore';

export default function AddAccountModal() {
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<'COMUM' | 'INDIVIDUAL' | 'TERCEIROS'>('COMUM');
  
  // Estados para regras específicas
  const [minhaPorcentagem, setMinhaPorcentagem] = useState('67');
  const [dono, setDono] = useState<'EU' | 'RAY'>('EU');
  
  const [isLoading, setIsLoading] = useState(false);

  // Calcula a porcentagem da Ray automaticamente
  const porcentagemRay = 100 - (Number(minhaPorcentagem) || 0);

  const handleSalvar = async () => {
    if (!nome.trim()) {
      Alert.alert('Atenção', 'Dê um nome para a tabela/cartão.');
      return;
    }

    setIsLoading(true);

    let percEu = 0;
    let percRay = 0;

    if (tipo === 'COMUM') {
      percEu = Number(minhaPorcentagem);
      percRay = porcentagemRay;
    } else if (tipo === 'INDIVIDUAL') {
      percEu = dono === 'EU' ? 100 : 0;
      percRay = dono === 'RAY' ? 100 : 0;
    }
    // Se for TERCEIROS, as duas ficam zeradas (0%), pois 100% vai para a dívida do terceiro

    const resultado = await salvarContaNoFirebase({
      nome,
      tipo,
      dono: tipo === 'INDIVIDUAL' ? dono : undefined,
      porcentagemEu: percEu,
      porcentagemRay: percRay
    });

    setIsLoading(false);

    if (resultado.sucesso) {
      Alert.alert('Sucesso', 'Tabela criada com sucesso!');
      router.back();
    } else {
      Alert.alert('Erro', 'Não foi possível criar a tabela.');
    }
  };

  return (
    <View style={styles.container}>
      {/* CABEÇALHO */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color="#6b7280" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nova Tabela / Cartão</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* NOME DA TABELA */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Nome da Tabela</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Cartão Férias, Nubank Emprestado..."
            value={nome}
            onChangeText={setNome}
          />
        </View>

        {/* TIPO DE TABELA */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Tipo de Tabela</Text>
          <View style={styles.chipContainer}>
            <TouchableOpacity 
              style={[styles.chip, tipo === 'COMUM' && styles.chipActive]} 
              onPress={() => setTipo('COMUM')}
            >
              <Text style={[styles.chipText, tipo === 'COMUM' && styles.chipTextActive]}>Conjunta</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.chip, tipo === 'INDIVIDUAL' && styles.chipActive]} 
              onPress={() => setTipo('INDIVIDUAL')}
            >
              <Text style={[styles.chipText, tipo === 'INDIVIDUAL' && styles.chipTextActive]}>Individual</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.chip, tipo === 'TERCEIROS' && styles.chipActive]} 
              onPress={() => setTipo('TERCEIROS')}
            >
              <Text style={[styles.chipText, tipo === 'TERCEIROS' && styles.chipTextActive]}>Terceiros</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* REGRAS DINÂMICAS BASEADAS NO TIPO */}
        <View style={styles.rulesContainer}>
          {tipo === 'COMUM' && (
            <View>
              <Text style={styles.ruleTitle}>Divisão da Conta</Text>
              <Text style={styles.ruleDesc}>Defina a sua porcentagem. A parte da Ray será calculada automaticamente.</Text>
              
              <View style={styles.splitRow}>
                <View style={styles.splitInputBox}>
                  <Text style={styles.splitLabel}>Sua Parte (%)</Text>
                  <TextInput
                    style={styles.splitInput}
                    keyboardType="numeric"
                    maxLength={3}
                    value={minhaPorcentagem}
                    onChangeText={(text) => setMinhaPorcentagem(text.replace(/[^0-9]/g, ''))}
                  />
                </View>
                <View style={styles.splitDivider} />
                <View style={styles.splitInputBox}>
                  <Text style={styles.splitLabel}>Parte Ray (%)</Text>
                  <Text style={styles.splitCalculated}>{porcentagemRay}%</Text>
                </View>
              </View>
            </View>
          )}

          {tipo === 'INDIVIDUAL' && (
            <View>
              <Text style={styles.ruleTitle}>De quem é esta conta?</Text>
              <View style={styles.chipContainer}>
                <TouchableOpacity style={[styles.chip, dono === 'EU' && styles.chipActive]} onPress={() => setDono('EU')}>
                  <Text style={[styles.chipText, dono === 'EU' && styles.chipTextActive]}>Minha</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.chip, dono === 'RAY' && styles.chipActive]} onPress={() => setDono('RAY')}>
                  <Text style={[styles.chipText, dono === 'RAY' && styles.chipTextActive]}>Da Ray</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {tipo === 'TERCEIROS' && (
            <View>
              <Text style={styles.ruleTitle}>Conta para Terceiros</Text>
              <Text style={styles.ruleDesc}>Tudo o que for registrado nesta tabela irá automaticamente para a categoria "A Receber", não afetando os gastos da casa.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* BOTÃO SALVAR */}
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.saveButton, isLoading && { opacity: 0.7 }]} onPress={handleSalvar} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.saveButtonText}>Criar Tabela</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  closeBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  scrollContent: { padding: 20 },
  
  formGroup: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 16, fontSize: 16, color: '#1f2937' },
  
  chipContainer: { flexDirection: 'row', gap: 10 },
  chip: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#f3f4f6', alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  chipActive: { backgroundColor: '#eff6ff', borderColor: '#3b82f6' },
  chipText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  chipTextActive: { color: '#3b82f6' },

  rulesContainer: { backgroundColor: '#f9fafb', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  ruleTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 8 },
  ruleDesc: { fontSize: 14, color: '#6b7280', marginBottom: 16, lineHeight: 20 },
  
  splitRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  splitInputBox: { flex: 1, alignItems: 'center' },
  splitLabel: { fontSize: 12, color: '#6b7280', marginBottom: 8 },
  splitInput: { fontSize: 24, fontWeight: 'bold', color: '#3b82f6', textAlign: 'center', borderBottomWidth: 2, borderBottomColor: '#3b82f6', minWidth: 60 },
  splitCalculated: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
  splitDivider: { width: 1, height: 40, backgroundColor: '#e5e7eb', marginHorizontal: 16 },

  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  saveButton: { backgroundColor: '#3b82f6', borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  saveButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});