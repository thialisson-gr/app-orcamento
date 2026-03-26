// app/add-account.tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../hooks/useTheme'; // 👈 TEMA AQUI
import { buscarRegraPadrao, salvarContaNoFirebase } from '../services/firebase/firestore';

export default function AddAccountScreen() {
  const { colors, isDarkMode } = useTheme(); // 👈 PUXANDO CORES
  const [fluxo, setFluxo] = useState<'DESPESA' | 'RECEITA'>('DESPESA');
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<'COMUM' | 'INDIVIDUAL' | 'TERCEIROS'>('COMUM');
  const [dono, setDono] = useState<'EU' | 'RAY'>('EU');
  const [porcentagemEu, setPorcentagemEu] = useState('50');

  useEffect(() => { buscarRegraPadrao().then(regra => { setPorcentagemEu(regra.me.toString()); }); }, []);

  const handleSalvar = async () => {
    if (!nome.trim()) { Alert.alert('Atenção', 'Digite um nome para a tabela.'); return; }
    const percEu = parseInt(porcentagemEu) || 0;
    const percRay = 100 - percEu;

    const resultado = await salvarContaNoFirebase({
      nome, tipo: fluxo === 'RECEITA' ? ('RECEITA' as any) : tipo, dono: fluxo === 'RECEITA' ? undefined : (tipo === 'INDIVIDUAL' ? dono : undefined), porcentagemEu: fluxo === 'RECEITA' ? 100 : (tipo === 'COMUM' ? percEu : (tipo === 'INDIVIDUAL' && dono === 'EU' ? 100 : 0)), porcentagemRay: fluxo === 'RECEITA' ? 0 : (tipo === 'COMUM' ? percRay : (tipo === 'INDIVIDUAL' && dono === 'RAY' ? 100 : 0)),
    });

    if (resultado.sucesso) router.back(); else Alert.alert('Erro', 'Não foi possível salvar a tabela.');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={[styles.header, { borderBottomColor: isDarkMode ? '#374151' : '#f3f4f6' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} activeOpacity={0.7}><Ionicons name="close" size={24} color={colors.subText} /></TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Criar Tabela</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={[styles.typeSelector, { backgroundColor: isDarkMode ? '#111827' : '#f3f4f6' }]}>
          <TouchableOpacity style={[styles.typeBtn, fluxo === 'DESPESA' && styles.typeBtnDespesa]} onPress={() => setFluxo('DESPESA')} activeOpacity={0.8}><Text style={[styles.typeText, { color: isDarkMode ? '#9ca3af' : '#6b7280' }, fluxo === 'DESPESA' && styles.typeTextActive]}>Para Despesas</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.typeBtn, fluxo === 'RECEITA' && styles.typeBtnReceita]} onPress={() => setFluxo('RECEITA')} activeOpacity={0.8}><Text style={[styles.typeText, { color: isDarkMode ? '#9ca3af' : '#6b7280' }, fluxo === 'RECEITA' && styles.typeTextActive]}>Para Receitas</Text></TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Nome da Tabela</Text>
          <TextInput style={[styles.input, { backgroundColor: isDarkMode ? '#111827' : '#f9fafb', borderColor: isDarkMode ? '#374151' : '#e5e7eb', color: colors.text }]} placeholderTextColor={colors.subText} placeholder={fluxo === 'DESPESA' ? "Ex: Casa 50/50, Cartão Nubank..." : "Ex: Conta Itaú, Salário..."} value={nome} onChangeText={setNome} />
        </View>

        {fluxo === 'DESPESA' && (
          <>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Como essa tabela funciona?</Text>
              <View style={styles.row}>
                <TouchableOpacity style={[styles.chip, { backgroundColor: isDarkMode ? '#374151' : '#f3f4f6', borderColor: isDarkMode ? '#4b5563' : '#e5e7eb' }, tipo === 'COMUM' && { backgroundColor: isDarkMode ? '#1e3a8a' : '#eff6ff', borderColor: colors.accent }]} onPress={() => setTipo('COMUM')}><Text style={[styles.chipText, { color: isDarkMode ? '#d1d5db' : '#6b7280' }, tipo === 'COMUM' && { color: colors.accent, fontWeight: 'bold' }]}>Dividir</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.chip, { backgroundColor: isDarkMode ? '#374151' : '#f3f4f6', borderColor: isDarkMode ? '#4b5563' : '#e5e7eb' }, tipo === 'INDIVIDUAL' && { backgroundColor: isDarkMode ? '#1e3a8a' : '#eff6ff', borderColor: colors.accent }]} onPress={() => setTipo('INDIVIDUAL')}><Text style={[styles.chipText, { color: isDarkMode ? '#d1d5db' : '#6b7280' }, tipo === 'INDIVIDUAL' && { color: colors.accent, fontWeight: 'bold' }]}>Individual</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.chip, { backgroundColor: isDarkMode ? '#374151' : '#f3f4f6', borderColor: isDarkMode ? '#4b5563' : '#e5e7eb' }, tipo === 'TERCEIROS' && { backgroundColor: isDarkMode ? '#1e3a8a' : '#eff6ff', borderColor: colors.accent }]} onPress={() => setTipo('TERCEIROS')}><Text style={[styles.chipText, { color: isDarkMode ? '#d1d5db' : '#6b7280' }, tipo === 'TERCEIROS' && { color: colors.accent, fontWeight: 'bold' }]}>Terceiros</Text></TouchableOpacity>
              </View>
            </View>

            {tipo === 'COMUM' && (
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Qual a sua porcentagem? (%)</Text>
                <TextInput style={[styles.input, { backgroundColor: isDarkMode ? '#111827' : '#f9fafb', borderColor: isDarkMode ? '#374151' : '#e5e7eb', color: colors.text }]} keyboardType="numeric" value={porcentagemEu} onChangeText={setPorcentagemEu} />
                <Text style={styles.helperText}>A parte da Ray será calculada automaticamente.</Text>
              </View>
            )}

            {tipo === 'INDIVIDUAL' && (
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>De quem é essa tabela?</Text>
                <View style={styles.row}>
                  <TouchableOpacity style={[styles.chip, { backgroundColor: isDarkMode ? '#374151' : '#f3f4f6', borderColor: isDarkMode ? '#4b5563' : '#e5e7eb' }, dono === 'EU' && { backgroundColor: isDarkMode ? '#1e3a8a' : '#eff6ff', borderColor: colors.accent }]} onPress={() => setDono('EU')}><Text style={[styles.chipText, { color: isDarkMode ? '#d1d5db' : '#6b7280' }, dono === 'EU' && { color: colors.accent, fontWeight: 'bold' }]}>Minha</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.chip, { backgroundColor: isDarkMode ? '#374151' : '#f3f4f6', borderColor: isDarkMode ? '#4b5563' : '#e5e7eb' }, dono === 'RAY' && { backgroundColor: isDarkMode ? '#1e3a8a' : '#eff6ff', borderColor: colors.accent }]} onPress={() => setDono('RAY')}><Text style={[styles.chipText, { color: isDarkMode ? '#d1d5db' : '#6b7280' }, dono === 'RAY' && { color: colors.accent, fontWeight: 'bold' }]}>Da Ray</Text></TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: isDarkMode ? '#374151' : '#f3f4f6' }]}>
        <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.accent }]} onPress={handleSalvar} activeOpacity={0.8}><Text style={styles.saveButtonText}>Criar Tabela</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 }, closeBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' }, headerTitle: { fontSize: 18, fontWeight: 'bold' }, scrollContent: { padding: 20 }, typeSelector: { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 24 }, typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' }, typeBtnDespesa: { backgroundColor: '#ef4444', shadowColor: '#ef4444', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, elevation: 2 }, typeBtnReceita: { backgroundColor: '#10b981', shadowColor: '#10b981', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, elevation: 2 }, typeText: { fontSize: 14, fontWeight: '600' }, typeTextActive: { color: '#ffffff' }, formGroup: { marginBottom: 24 }, label: { fontSize: 14, fontWeight: '600', marginBottom: 8 }, input: { borderWidth: 1, borderRadius: 12, padding: 16, fontSize: 16 }, helperText: { fontSize: 12, color: '#6b7280', marginTop: 8 }, row: { flexDirection: 'row', gap: 12 }, chip: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1 }, chipText: { fontSize: 14, fontWeight: '500' }, footer: { padding: 20, borderTopWidth: 1 }, saveButton: { borderRadius: 16, paddingVertical: 18, alignItems: 'center' }, saveButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});