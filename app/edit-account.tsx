// app/edit-account.tsx
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AccountSplitSlider } from '../components/AccountSplitSlider';
import { useIdentity } from '../hooks/useIdentity';
import { useTheme } from '../hooks/useTheme';
import { atualizarContaNoFirebase } from '../services/firebase/firestore';

export default function EditAccountScreen() {
  const params = useLocalSearchParams();
  const { colors, isDarkMode } = useTheme(); 
  const { perfil } = useIdentity(); 
  
  const id = params.id as string;
  const nomeOriginal = params.nomeOriginal as string;
  const fluxo = params.tipoOriginal === 'RECEITA' ? 'RECEITA' : 'DESPESA';
  
  const [nome, setNome] = useState(nomeOriginal);
  const [tipo, setTipo] = useState<'COMUM' | 'INDIVIDUAL' | 'TERCEIROS'>((params.tipoOriginal as any) || 'COMUM');
  const [dono, setDono] = useState<'EU' | 'RAY'>((params.donoOriginal as any) || (perfil || 'EU'));
  // Transformamos em número para o Slider funcionar
  const [porcentagemEu, setPorcentagemEu] = useState(parseInt(params.porcentagemOriginal as string) || 50);
  const [isLoading, setIsLoading] = useState(false);

  const nomeDoParceiro = perfil === 'RAY' ? 'Thialisson' : 'Rayane';

  const aumentarPorcentagem = () => setPorcentagemEu(prev => Math.min(100, prev + 5));
  const diminuirPorcentagem = () => setPorcentagemEu(prev => Math.max(0, prev - 5));

  const handleSalvar = async () => {
    if (!nome.trim()) return Alert.alert('Atenção', 'O nome não pode ficar vazio.');
    setIsLoading(true);
    
    const valorDigitado = porcentagemEu;
    let percEu = 50;
    let percRay = 50;
    
    if (perfil === 'RAY') {
      percRay = valorDigitado;
      percEu = 100 - valorDigitado;
    } else {
      percEu = valorDigitado;
      percRay = 100 - valorDigitado;
    }

    let donoFinal = null;
    if (fluxo === 'RECEITA' || tipo === 'TERCEIROS') {
      donoFinal = perfil || 'EU'; 
    } else if (tipo === 'INDIVIDUAL') {
      donoFinal = dono; 
    }

    const resultado = await atualizarContaNoFirebase(id, nomeOriginal, {
      nome, 
      tipo: fluxo === 'RECEITA' ? 'RECEITA' : tipo, 
      dono: donoFinal, 
      porcentagemEu: fluxo === 'RECEITA' ? 100 : (tipo === 'COMUM' ? percEu : (tipo === 'INDIVIDUAL' && dono === 'EU' ? 100 : 0)), 
      porcentagemRay: fluxo === 'RECEITA' ? 0 : (tipo === 'COMUM' ? percRay : (tipo === 'INDIVIDUAL' && dono === 'RAY' ? 100 : 0)),
    });
    setIsLoading(false);
    if (resultado.sucesso) router.back(); else Alert.alert('Erro', 'Não foi possível atualizar a tabela.');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.compactHeader, { backgroundColor: colors.card, borderBottomColor: isDarkMode ? '#334155' : '#e5e7eb' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Editar Tabela</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.infoBox, { backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff' }]}>
          <Ionicons name="information-circle" size={20} color={colors.accent} />
          <Text style={[styles.infoText, { color: isDarkMode ? '#bfdbfe' : '#1e3a8a' }]}>Se você mudar o nome da tabela, todas as transações antigas serão atualizadas automaticamente para o novo nome.</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Nome da Tabela</Text>
          <TextInput style={[styles.input, { backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc', borderColor: isDarkMode ? '#334155' : '#e2e8f0', color: colors.text }]} value={nome} onChangeText={setNome} />
        </View>

        {fluxo === 'DESPESA' && (
          <>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Como essa tabela funciona?</Text>
              <View style={styles.row}>
                <TouchableOpacity style={[styles.chip, { backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', borderColor: isDarkMode ? '#334155' : '#e2e8f0' }, tipo === 'COMUM' && { backgroundColor: colors.accentLight, borderColor: colors.accent }]} onPress={() => setTipo('COMUM')}><Text style={[styles.chipText, { color: isDarkMode ? '#cbd5e1' : '#64748b' }, tipo === 'COMUM' && { color: colors.accent, fontWeight: 'bold' }]}>Dividir</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.chip, { backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', borderColor: isDarkMode ? '#334155' : '#e2e8f0' }, tipo === 'INDIVIDUAL' && { backgroundColor: colors.accentLight, borderColor: colors.accent }]} onPress={() => setTipo('INDIVIDUAL')}><Text style={[styles.chipText, { color: isDarkMode ? '#cbd5e1' : '#64748b' }, tipo === 'INDIVIDUAL' && { color: colors.accent, fontWeight: 'bold' }]}>Individual</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.chip, { backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', borderColor: isDarkMode ? '#334155' : '#e2e8f0' }, tipo === 'TERCEIROS' && { backgroundColor: colors.accentLight, borderColor: colors.accent }]} onPress={() => setTipo('TERCEIROS')}><Text style={[styles.chipText, { color: isDarkMode ? '#cbd5e1' : '#64748b' }, tipo === 'TERCEIROS' && { color: colors.accent, fontWeight: 'bold' }]}>Terceiros</Text></TouchableOpacity>
              </View>
            </View>

            {tipo === 'COMUM' && (
              <AccountSplitSlider 
                porcentagemEu={porcentagemEu}
                onAumentar={aumentarPorcentagem}
                onDiminuir={diminuirPorcentagem}
                nomeParceiro={nomeDoParceiro}
              />
            )}

            {tipo === 'INDIVIDUAL' && (
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>De quem é essa tabela?</Text>
                <View style={styles.row}>
                  <TouchableOpacity style={[styles.chip, { backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', borderColor: isDarkMode ? '#334155' : '#e2e8f0' }, dono === 'EU' && { backgroundColor: colors.accentLight, borderColor: colors.accent }]} onPress={() => setDono('EU')}><Text style={[styles.chipText, { color: isDarkMode ? '#cbd5e1' : '#64748b' }, dono === 'EU' && { color: colors.accent, fontWeight: 'bold' }]}>Minha</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.chip, { backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', borderColor: isDarkMode ? '#334155' : '#e2e8f0' }, dono === 'RAY' && { backgroundColor: colors.accentLight, borderColor: colors.accent }]} onPress={() => setDono('RAY')}><Text style={[styles.chipText, { color: isDarkMode ? '#cbd5e1' : '#64748b' }, dono === 'RAY' && { color: colors.accent, fontWeight: 'bold' }]}>{nomeDoParceiro}</Text></TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: isDarkMode ? '#334155' : '#f1f5f9' }]}>
        <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.accent }, isLoading && {opacity: 0.7}]} onPress={handleSalvar} activeOpacity={0.8} disabled={isLoading}>{isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Salvar Alterações</Text>}</TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, 
  compactHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 50, paddingBottom: 16, borderBottomWidth: 1 }, 
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' }, 
  headerTitle: { fontSize: 18, fontWeight: 'bold' }, 
  scrollContent: { padding: 24 }, 
  
  infoBox: { flexDirection: 'row', padding: 16, borderRadius: 16, marginBottom: 24, alignItems: 'center', gap: 10 }, 
  infoText: { flex: 1, fontSize: 13, lineHeight: 20, fontWeight: '500' }, 
  
  formGroup: { marginBottom: 24 }, 
  label: { fontSize: 13, fontWeight: 'bold', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }, 
  input: { borderWidth: 1, borderRadius: 16, padding: 16, fontSize: 16 }, 
  
  row: { flexDirection: 'row', gap: 12 }, 
  chip: { flex: 1, paddingVertical: 14, borderRadius: 24, alignItems: 'center', borderWidth: 1 }, 
  chipText: { fontSize: 15, fontWeight: '600' }, 
  
  footer: { padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, borderTopWidth: 1 }, 
  saveButton: { borderRadius: 20, paddingVertical: 18, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6 }, 
  saveButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});