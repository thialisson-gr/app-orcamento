// app/edit-account.tsx
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useIdentity } from '../hooks/useIdentity'; // 👈 Cérebro de Identidade importado!
import { useTheme } from '../hooks/useTheme';
import { atualizarContaNoFirebase } from '../services/firebase/firestore';

export default function EditAccountScreen() {
  const params = useLocalSearchParams();
  const { colors, isDarkMode } = useTheme(); 
  const { perfil } = useIdentity(); // 👈 Quem está com o celular na mão?
  
  const id = params.id as string;
  const nomeOriginal = params.nomeOriginal as string;
  const fluxo = params.tipoOriginal === 'RECEITA' ? 'RECEITA' : 'DESPESA';
  
  const [nome, setNome] = useState(nomeOriginal);
  const [tipo, setTipo] = useState<'COMUM' | 'INDIVIDUAL' | 'TERCEIROS'>((params.tipoOriginal as any) || 'COMUM');
  const [dono, setDono] = useState<'EU' | 'RAY'>((params.donoOriginal as any) || (perfil || 'EU'));
  const [porcentagemEu, setPorcentagemEu] = useState(params.porcentagemOriginal as string);
  const [isLoading, setIsLoading] = useState(false);

  const handleSalvar = async () => {
    if (!nome.trim()) return Alert.alert('Atenção', 'O nome não pode ficar vazio.');
    setIsLoading(true);
    const percEu = parseInt(porcentagemEu) || 0;
    const percRay = 100 - percEu;

    // 🛡️ LÓGICA DE DONO CORRIGIDA:
    // Se for RECEITA, TERCEIROS ou INDIVIDUAL, o dono deve ser gravado!
    let donoFinal = null;
    if (fluxo === 'RECEITA' || tipo === 'TERCEIROS') {
      donoFinal = perfil || 'EU'; // Carimba quem está segurando o celular
    } else if (tipo === 'INDIVIDUAL') {
      donoFinal = dono; // Pega o que foi selecionado na tela (Minha / Ray)
    }

    const resultado = await atualizarContaNoFirebase(id, nomeOriginal, {
      nome, 
      tipo: fluxo === 'RECEITA' ? 'RECEITA' : tipo, 
      dono: donoFinal, // 👈 Agora manda a etiqueta correta pro Firebase
      porcentagemEu: fluxo === 'RECEITA' ? 100 : (tipo === 'COMUM' ? percEu : (tipo === 'INDIVIDUAL' && dono === 'EU' ? 100 : 0)), 
      porcentagemRay: fluxo === 'RECEITA' ? 0 : (tipo === 'COMUM' ? percRay : (tipo === 'INDIVIDUAL' && dono === 'RAY' ? 100 : 0)),
    });
    setIsLoading(false);
    if (resultado.sucesso) router.back(); else Alert.alert('Erro', 'Não foi possível atualizar a tabela.');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.compactHeader, { backgroundColor: colors.card, borderBottomColor: isDarkMode ? '#374151' : '#e5e7eb' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Editar Tabela</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.infoBox, { backgroundColor: isDarkMode ? '#1e3a8a' : '#eff6ff' }]}>
          <Ionicons name="information-circle" size={20} color={colors.accent} />
          <Text style={[styles.infoText, { color: isDarkMode ? '#bfdbfe' : '#1e3a8a' }]}>Se você mudar o nome da tabela, todas as transações antigas serão atualizadas automaticamente para o novo nome.</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Nome da Tabela</Text>
          <TextInput style={[styles.input, { backgroundColor: isDarkMode ? '#111827' : '#f9fafb', borderColor: isDarkMode ? '#374151' : '#e5e7eb', color: colors.text }]} value={nome} onChangeText={setNome} />
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
        <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.accent }, isLoading && {opacity: 0.7}]} onPress={handleSalvar} activeOpacity={0.8} disabled={isLoading}>{isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Salvar Alterações</Text>}</TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, compactHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 50 : 40, paddingBottom: 16, borderBottomWidth: 1 }, backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' }, headerTitle: { fontSize: 18, fontWeight: 'bold' }, scrollContent: { padding: 20 }, infoBox: { flexDirection: 'row', padding: 16, borderRadius: 6, marginBottom: 24, alignItems: 'center', gap: 10 }, infoText: { flex: 1, fontSize: 13, lineHeight: 18 }, formGroup: { marginBottom: 24 }, label: { fontSize: 14, fontWeight: '600', marginBottom: 8 }, input: { borderWidth: 1, borderRadius: 6, padding: 12, fontSize: 16 }, helperText: { fontSize: 12, color: '#6b7280', marginTop: 8 }, row: { flexDirection: 'row', gap: 12 }, chip: { flex: 1, paddingVertical: 12, borderRadius: 25, alignItems: 'center', borderWidth: 1 }, chipText: { fontSize: 14, fontWeight: '500' }, footer: { padding: 20, borderTopWidth: 1 }, saveButton: { borderRadius: 6, paddingVertical: 18, alignItems: 'center' }, saveButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});