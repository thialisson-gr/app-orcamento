// app/add-account.tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useIdentity } from '../hooks/useIdentity'; // 👈 Importamos o Cérebro de Identidade
import { useTheme } from '../hooks/useTheme';
import { buscarRegraPadrao, salvarContaNoFirebase } from '../services/firebase/firestore';

export default function AddAccountScreen() {
  const { colors, isDarkMode } = useTheme(); 
  const { perfil } = useIdentity(); // 👈 Descobre quem está logado

  const [fluxo, setFluxo] = useState<'DESPESA' | 'RECEITA'>('DESPESA');
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<'COMUM' | 'INDIVIDUAL' | 'TERCEIROS'>('COMUM');
  const [dono, setDono] = useState<'EU' | 'RAY'>('EU');
  const [porcentagemEu, setPorcentagemEu] = useState('50');

  useEffect(() => { buscarRegraPadrao().then(regra => setPorcentagemEu(regra.me.toString())); }, []);

  const handleSalvar = async () => {
    if (!nome.trim()) return Alert.alert('Atenção', 'Digite um nome para a tabela.');
    
    // 👇 LÓGICA DE PORCENTAGEM INTELIGENTE
    const valorDigitado = parseInt(porcentagemEu) || 0;
    let percEu = 50;
    let percRay = 50;
    
    // Garante que se a Ray digitar "40" em "Sua porcentagem", isso vá para a conta DELA no banco!
    if (perfil === 'RAY') {
      percRay = valorDigitado;
      percEu = 100 - valorDigitado;
    } else {
      percEu = valorDigitado;
      percRay = 100 - valorDigitado;
    }

    let donoFinal = undefined;
    if (fluxo === 'RECEITA' || (fluxo === 'DESPESA' && tipo === 'TERCEIROS')) {
      donoFinal = perfil || 'EU'; 
    } else if (fluxo === 'DESPESA' && tipo === 'INDIVIDUAL') {
      donoFinal = dono; 
    }

    const res = await salvarContaNoFirebase({
      nome, 
      tipo: fluxo === 'RECEITA' ? ('RECEITA' as any) : tipo, 
      dono: donoFinal, 
      porcentagemEu: fluxo === 'RECEITA' ? 100 : (tipo === 'COMUM' ? percEu : (tipo === 'INDIVIDUAL' && dono === 'EU' ? 100 : 0)), 
      porcentagemRay: fluxo === 'RECEITA' ? 0 : (tipo === 'COMUM' ? percRay : (tipo === 'INDIVIDUAL' && dono === 'RAY' ? 100 : 0)),
    });
    
    if (res.sucesso) router.back(); else Alert.alert('Erro', 'Falha ao salvar.');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.card }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { borderBottomColor: isDarkMode ? '#334155' : '#f1f5f9' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} activeOpacity={0.7}><Ionicons name="close" size={24} color={colors.subText} /></TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Criar Tabela</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={[styles.typeSelector, { backgroundColor: isDarkMode ? '#0f172a' : '#f1f5f9' }]}>
          <TouchableOpacity style={[styles.typeBtn, fluxo === 'DESPESA' && styles.typeBtnDespesa]} onPress={() => setFluxo('DESPESA')}><Text style={[styles.typeText, { color: isDarkMode ? '#94a3b8' : '#64748b' }, fluxo === 'DESPESA' && styles.typeTextActive]}>Para Despesas</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.typeBtn, fluxo === 'RECEITA' && styles.typeBtnReceita]} onPress={() => setFluxo('RECEITA')}><Text style={[styles.typeText, { color: isDarkMode ? '#94a3b8' : '#64748b' }, fluxo === 'RECEITA' && styles.typeTextActive]}>Para Receitas</Text></TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Nome da Tabela</Text>
          <TextInput style={[styles.input, { backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc', borderColor: isDarkMode ? '#334155' : '#e2e8f0', color: colors.text }]} placeholderTextColor={colors.subText} placeholder={fluxo === 'DESPESA' ? "Ex: comum, individual, terceiros..." : "Ex: Salário..."} value={nome} onChangeText={setNome} />
        </View>

        {fluxo === 'DESPESA' && (
          <>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Regra de Divisão</Text>
              <View style={styles.row}>
                <TouchableOpacity style={[styles.chip, { backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', borderColor: isDarkMode ? '#475569' : '#e2e8f0' }, tipo === 'COMUM' && { backgroundColor: colors.accentLight, borderColor: colors.accent }]} onPress={() => setTipo('COMUM')}><Text style={[styles.chipText, { color: isDarkMode ? '#cbd5e1' : '#64748b' }, tipo === 'COMUM' && { color: colors.accent, fontWeight: 'bold' }]}>Casal</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.chip, { backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', borderColor: isDarkMode ? '#475569' : '#e2e8f0' }, tipo === 'INDIVIDUAL' && { backgroundColor: colors.accentLight, borderColor: colors.accent }]} onPress={() => setTipo('INDIVIDUAL')}><Text style={[styles.chipText, { color: isDarkMode ? '#cbd5e1' : '#64748b' }, tipo === 'INDIVIDUAL' && { color: colors.accent, fontWeight: 'bold' }]}>Individual</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.chip, { backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', borderColor: isDarkMode ? '#475569' : '#e2e8f0' }, tipo === 'TERCEIROS' && { backgroundColor: colors.accentLight, borderColor: colors.accent }]} onPress={() => setTipo('TERCEIROS')}><Text style={[styles.chipText, { color: isDarkMode ? '#cbd5e1' : '#64748b' }, tipo === 'TERCEIROS' && { color: colors.accent, fontWeight: 'bold' }]}>Terceiros</Text></TouchableOpacity>
              </View>
            </View>

            {tipo === 'COMUM' && (
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Sua porcentagem (%)</Text>
                <TextInput style={[styles.input, { backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc', borderColor: isDarkMode ? '#334155' : '#e2e8f0', color: colors.text }]} keyboardType="numeric" value={porcentagemEu} onChangeText={setPorcentagemEu} />
              </View>
            )}

            {tipo === 'INDIVIDUAL' && (
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Dono da Tabela</Text>
                <View style={styles.row}>
                  <TouchableOpacity style={[styles.chip, { backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', borderColor: isDarkMode ? '#475569' : '#e2e8f0' }, dono === 'EU' && { backgroundColor: colors.accentLight, borderColor: colors.accent }]} onPress={() => setDono('EU')}><Text style={[styles.chipText, { color: isDarkMode ? '#cbd5e1' : '#64748b' }, dono === 'EU' && { color: colors.accent, fontWeight: 'bold' }]}>Eu</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.chip, { backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', borderColor: isDarkMode ? '#475569' : '#e2e8f0' }, dono === 'RAY' && { backgroundColor: colors.accentLight, borderColor: colors.accent }]} onPress={() => setDono('RAY')}><Text style={[styles.chipText, { color: isDarkMode ? '#cbd5e1' : '#64748b' }, dono === 'RAY' && { color: colors.accent, fontWeight: 'bold' }]}>Ray</Text></TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: isDarkMode ? '#334155' : '#f1f5f9' }]}>
        <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.accent }]} onPress={handleSalvar} activeOpacity={0.8}><Text style={styles.saveButtonText}>Criar Tabela</Text></TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: Platform.OS === 'ios' ? 60 : 50, borderBottomWidth: 1 }, 
  closeBtn: { width: 40, height: 40, justifyContent: 'center' }, 
  headerTitle: { fontSize: 18, fontWeight: 'bold' }, 
  scrollContent: { padding: 20 }, 
  typeSelector: { flexDirection: 'row', borderRadius: 6, padding: 4, marginBottom: 24 }, 
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 4, alignItems: 'center' }, 
  typeBtnDespesa: { backgroundColor: '#ef4444', elevation: 2 }, 
  typeBtnReceita: { backgroundColor: '#10b981', elevation: 2 }, 
  typeText: { fontSize: 14, fontWeight: '600' }, 
  typeTextActive: { color: '#ffffff' }, 
  formGroup: { marginBottom: 20 }, 
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 }, 
  input: { borderWidth: 1, borderRadius: 6, padding: 12, fontSize: 15 }, 
  row: { flexDirection: 'row', gap: 10 }, 
  chip: { flex: 1, paddingVertical: 12, borderRadius: 28, alignItems: 'center', borderWidth: 1 }, 
  chipText: { fontSize: 14, fontWeight: '500' }, 
  footer: { padding: 20, borderTopWidth: 1 }, 
  saveButton: { borderRadius: 6, paddingVertical: 16, alignItems: 'center' }, 
  saveButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});