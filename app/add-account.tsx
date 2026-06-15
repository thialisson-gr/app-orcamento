// app/add-account.tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { AccountSplitSlider } from '../components/AccountSplitSlider';
import { TransactionTypeSelector } from '../components/TransactionTypeSelector';
import { useIdentity } from '../hooks/useIdentity';
import { useTheme } from '../hooks/useTheme';
import { buscarRegraPadrao, salvarContaNoFirebase } from '../services/firebase/firestore';

export default function AddAccountScreen() {
  const { colors, isDarkMode } = useTheme(); 
  const { perfil } = useIdentity(); 

  const [fluxo, setFluxo] = useState<'DESPESA' | 'RECEITA'>('DESPESA');
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<'COMUM' | 'INDIVIDUAL' | 'TERCEIROS'>('COMUM');
  const [dono, setDono] = useState<'EU' | 'RAY'>('EU');
  const [porcentagemEu, setPorcentagemEu] = useState(50);

  // Identifica o nome do parceiro dinamicamente
  const nomeDoParceiro = perfil === 'RAY' ? 'Thialisson' : 'Rayane';

  useEffect(() => { 
    buscarRegraPadrao().then(regra => setPorcentagemEu(regra.me)); 
  }, []);

  // Funções da Trava Inteligente
  const aumentarPorcentagem = () => setPorcentagemEu(prev => Math.min(100, prev + 5));
  const diminuirPorcentagem = () => setPorcentagemEu(prev => Math.max(0, prev - 5));

  const handleSalvar = async () => {
    if (!nome.trim()) return Alert.alert('Atenção', 'Digite um nome para a tabela.');
    
    let percEu = 50;
    let percRay = 50;
    
    if (perfil === 'RAY') {
      percRay = porcentagemEu;
      percEu = 100 - porcentagemEu;
    } else {
      percEu = porcentagemEu;
      percRay = 100 - porcentagemEu;
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
    
    if (res.sucesso) router.back(); else Alert.alert('Erro', 'Falha ao salvar a tabela.');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.card }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { borderBottomColor: isDarkMode ? '#334155' : '#f1f5f9' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} activeOpacity={0.7}><Ionicons name="close" size={24} color={colors.subText} /></TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Criar Tabela</Text>
        <View style={{ width: 40 }} />
      </View>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <TransactionTypeSelector 
            tipo={fluxo} 
            onChange={setFluxo} 
            labelDespesa="Para Despesas" 
            labelReceita="Para Receitas" 
          />

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Nome da Tabela</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc', borderColor: isDarkMode ? '#334155' : '#e2e8f0', color: colors.text }]} 
              placeholderTextColor={colors.subText} 
              placeholder={fluxo === 'DESPESA' ? "Ex: Mercado, Viagem, Reforma..." : "Ex: Salário, Rendimentos..."} 
              value={nome} 
              onChangeText={setNome} 
            />
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
                <AccountSplitSlider 
                  porcentagemEu={porcentagemEu}
                  onAumentar={aumentarPorcentagem}
                  onDiminuir={diminuirPorcentagem}
                  nomeParceiro={nomeDoParceiro}
                />
              )}

              {tipo === 'INDIVIDUAL' && (
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Dono da Tabela</Text>
                  <View style={styles.row}>
                    <TouchableOpacity style={[styles.chip, { backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', borderColor: isDarkMode ? '#475569' : '#e2e8f0' }, dono === 'EU' && { backgroundColor: colors.accentLight, borderColor: colors.accent }]} onPress={() => setDono('EU')}><Text style={[styles.chipText, { color: isDarkMode ? '#cbd5e1' : '#64748b' }, dono === 'EU' && { color: colors.accent, fontWeight: 'bold' }]}>Eu</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.chip, { backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', borderColor: isDarkMode ? '#475569' : '#e2e8f0' }, dono === 'RAY' && { backgroundColor: colors.accentLight, borderColor: colors.accent }]} onPress={() => setDono('RAY')}><Text style={[styles.chipText, { color: isDarkMode ? '#cbd5e1' : '#64748b' }, dono === 'RAY' && { color: colors.accent, fontWeight: 'bold' }]}>{nomeDoParceiro}</Text></TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </TouchableWithoutFeedback>

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
  scrollContent: { padding: 24 },  
  
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