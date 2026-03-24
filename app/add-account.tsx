// app/add-account.tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { salvarContaNoFirebase } from '../services/firebase/firestore';

export default function AddAccountScreen() {
  const [fluxo, setFluxo] = useState<'DESPESA' | 'RECEITA'>('DESPESA');
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<'COMUM' | 'INDIVIDUAL' | 'TERCEIROS'>('COMUM');
  const [dono, setDono] = useState<'EU' | 'RAY'>('EU');
  const [porcentagemEu, setPorcentagemEu] = useState('50');

  const handleSalvar = async () => {
    if (!nome.trim()) {
      Alert.alert('Atenção', 'Digite um nome para a tabela.');
      return;
    }

    const percEu = parseInt(porcentagemEu) || 0;
    const percRay = 100 - percEu;

    const resultado = await salvarContaNoFirebase({
      nome,
      tipo: fluxo === 'RECEITA' ? ('RECEITA' as any) : tipo,
      dono: fluxo === 'RECEITA' ? undefined : (tipo === 'INDIVIDUAL' ? dono : undefined),
      porcentagemEu: fluxo === 'RECEITA' ? 100 : (tipo === 'COMUM' ? percEu : (tipo === 'INDIVIDUAL' && dono === 'EU' ? 100 : 0)),
      porcentagemRay: fluxo === 'RECEITA' ? 0 : (tipo === 'COMUM' ? percRay : (tipo === 'INDIVIDUAL' && dono === 'RAY' ? 100 : 0)),
    });

    if (resultado.sucesso) {
      router.back();
    } else {
      Alert.alert('Erro', 'Não foi possível salvar a tabela.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} activeOpacity={0.7}>
          <Ionicons name="close" size={24} color="#6b7280" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Criar Tabela</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* SELETOR RECEITA / DESPESA */}
        <View style={styles.typeSelector}>
          <TouchableOpacity style={[styles.typeBtn, fluxo === 'DESPESA' && styles.typeBtnDespesa]} onPress={() => setFluxo('DESPESA')} activeOpacity={0.8}>
            <Text style={[styles.typeText, fluxo === 'DESPESA' && styles.typeTextActive]}>Para Despesas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.typeBtn, fluxo === 'RECEITA' && styles.typeBtnReceita]} onPress={() => setFluxo('RECEITA')} activeOpacity={0.8}>
            <Text style={[styles.typeText, fluxo === 'RECEITA' && styles.typeTextActive]}>Para Receitas</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Nome da Tabela</Text>
          <TextInput
            style={styles.input}
            placeholder={fluxo === 'DESPESA' ? "Ex: Casa 50/50, Cartão Nubank..." : "Ex: Conta Itaú, Salário..."}
            value={nome}
            onChangeText={setNome}
          />
        </View>

        {/* OPÇÕES EXTRAS SÓ APARECEM SE FOR DESPESA */}
        {fluxo === 'DESPESA' && (
          <>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Como essa tabela funciona?</Text>
              <View style={styles.row}>
                <TouchableOpacity style={[styles.chip, tipo === 'COMUM' && styles.chipActive]} onPress={() => setTipo('COMUM')}>
                  <Text style={[styles.chipText, tipo === 'COMUM' && styles.chipTextActive]}>Dividir</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.chip, tipo === 'INDIVIDUAL' && styles.chipActive]} onPress={() => setTipo('INDIVIDUAL')}>
                  <Text style={[styles.chipText, tipo === 'INDIVIDUAL' && styles.chipTextActive]}>Individual</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.chip, tipo === 'TERCEIROS' && styles.chipActive]} onPress={() => setTipo('TERCEIROS')}>
                  <Text style={[styles.chipText, tipo === 'TERCEIROS' && styles.chipTextActive]}>Terceiros</Text>
                </TouchableOpacity>
              </View>
            </View>

            {tipo === 'COMUM' && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Qual a sua porcentagem? (%)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={porcentagemEu}
                  onChangeText={setPorcentagemEu}
                />
                <Text style={styles.helperText}>A parte da Ray será calculada automaticamente.</Text>
              </View>
            )}

            {tipo === 'INDIVIDUAL' && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>De quem é essa tabela?</Text>
                <View style={styles.row}>
                  <TouchableOpacity style={[styles.chip, dono === 'EU' && styles.chipActive]} onPress={() => setDono('EU')}>
                    <Text style={[styles.chipText, dono === 'EU' && styles.chipTextActive]}>Minha</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.chip, dono === 'RAY' && styles.chipActive]} onPress={() => setDono('RAY')}>
                    <Text style={[styles.chipText, dono === 'RAY' && styles.chipTextActive]}>Da Ray</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSalvar} activeOpacity={0.8}>
          <Text style={styles.saveButtonText}>Criar Tabela</Text>
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
  
  typeSelector: { flexDirection: 'row', backgroundColor: '#f3f4f6', borderRadius: 12, padding: 4, marginBottom: 24 },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  typeBtnDespesa: { backgroundColor: '#ef4444', shadowColor: '#ef4444', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, elevation: 2 },
  typeBtnReceita: { backgroundColor: '#10b981', shadowColor: '#10b981', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, elevation: 2 },
  typeText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  typeTextActive: { color: '#ffffff' },

  formGroup: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 16, fontSize: 16, color: '#1f2937' },
  helperText: { fontSize: 12, color: '#6b7280', marginTop: 8 },
  row: { flexDirection: 'row', gap: 12 },
  chip: { flex: 1, backgroundColor: '#f3f4f6', paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  chipActive: { backgroundColor: '#eff6ff', borderColor: '#3b82f6' },
  chipText: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  chipTextActive: { color: '#3b82f6', fontWeight: 'bold' },
  
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#f3f4f6', backgroundColor: '#ffffff' },
  saveButton: { backgroundColor: '#3b82f6', borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  saveButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});