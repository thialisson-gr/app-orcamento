// app/edit-transaction.tsx
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAccounts } from '../hooks/useAccounts';
import { useTheme } from '../hooks/useTheme';
import { atualizarTransacaoNoFirebase } from '../services/firebase/firestore';

const TAGS_DESPESA = ['🛒 Super', '🍔 Lazer', '🏠 Casa', '🚗 Transp.', '🏥 Saúde', '🛍️ Compras', '⚡ Contas', '🏷️ Outros'];
const TAGS_RECEITA = ['💰 Salário', '💸 Pix', '🏦 Transf.', '📈 Rends.', '🎁 Outros'];

export default function EditTransactionScreen() {
  const params = useLocalSearchParams();
  const id = params.id as string;
  
  const { contas } = useAccounts();
  const { colors, isDarkMode } = useTheme(); 

  const [tipo, setTipo] = useState<'DESPESA' | 'RECEITA'>('DESPESA');
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataAlvo, setDataAlvo] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [contaSelecionada, setContaSelecionada] = useState('');
  const [tagSelecionada, setTagSelecionada] = useState('');
  const [categoriaCustomizada, setCategoriaCustomizada] = useState('');
  const [isTerceiro, setIsTerceiro] = useState(false);
  const [nomeTerceiro, setNomeTerceiro] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 👇 O FREIO DE MÃO TAMBÉM AQUI
  const jaInicializou = useRef(false);

  useEffect(() => {
    if (!jaInicializou.current && params.tipoOriginal) {
      setTipo(params.tipoOriginal as any);
      if (params.descOriginal) setDescricao(params.descOriginal as string);
      if (params.contaOriginal) setContaSelecionada(params.contaOriginal as string);
      if (params.nomeTerceiroOriginal) setNomeTerceiro(params.nomeTerceiroOriginal as string);
      if (params.isTerceiroOriginal === 'true') setIsTerceiro(true);
      
      if (params.valorOriginal) {
        const valNum = Number(params.valorOriginal);
        if (!isNaN(valNum)) setValor(valNum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      }
      
      if (params.dataOriginal) {
        setDataAlvo(new Date(params.dataOriginal as string));
      }

      if (params.tagOriginal) {
        const tagParam = params.tagOriginal as string;
        if (TAGS_DESPESA.includes(tagParam) || TAGS_RECEITA.includes(tagParam)) {
          setTagSelecionada(tagParam);
        } else {
          setTagSelecionada('🏷️ Outros');
          setCategoriaCustomizada(tagParam);
        }
      }

      jaInicializou.current = true; // Trava ativada!
    }
  }, [params]);

  const contaAtual = contas.find(c => c.nome === contaSelecionada);
  const isContaTerceiros = contaAtual?.tipo === 'TERCEIROS';

  const handleValorChange = (t: string) => {
    const n = t.replace(/\D/g, '');
    if (!n) return setValor('');
    setValor((Number(n) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) setDataAlvo(selectedDate);
  };

  const handleSalvar = async () => {
    if (!valor || !descricao) return Alert.alert('Atenção', 'Preencha o valor e a descrição.');
    setIsLoading(true);
    const tagFinal = tagSelecionada.includes('Outros') && categoriaCustomizada ? categoriaCustomizada : tagSelecionada;
    
    const res = await atualizarTransacaoNoFirebase(id, {
      tipo, valorFormatado: valor, descricao, contaSelecionada, tagSelecionada: tagFinal, isTerceiro: tipo === 'DESPESA' ? isTerceiro : false, nomeTerceiro, dataPagamento: dataAlvo.toLocaleDateString('pt-BR') 
    });
    
    setIsLoading(false);
    if (res.sucesso) router.back(); else Alert.alert('Erro', 'Falha ao atualizar.');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.card }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { borderBottomColor: isDarkMode ? '#334155' : '#f1f5f9' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} activeOpacity={0.7}><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Editar Transação</Text>
        <View style={{ width: 40 }} /> 
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={[styles.typeSelector, { backgroundColor: isDarkMode ? '#0f172a' : '#f1f5f9' }]}>
          <TouchableOpacity style={[styles.typeBtn, tipo === 'DESPESA' && styles.typeBtnDespesa]} onPress={() => {setTipo('DESPESA'); setTagSelecionada(TAGS_DESPESA[0]);}}><Text style={[styles.typeText, { color: isDarkMode ? '#94a3b8' : '#64748b' }, tipo === 'DESPESA' && styles.typeTextActive]}>Despesa</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.typeBtn, tipo === 'RECEITA' && styles.typeBtnReceita]} onPress={() => {setTipo('RECEITA'); setTagSelecionada(TAGS_RECEITA[0]);}}><Text style={[styles.typeText, { color: isDarkMode ? '#94a3b8' : '#64748b' }, tipo === 'RECEITA' && styles.typeTextActive]}>Receita</Text></TouchableOpacity>
        </View>

        <View style={styles.amountContainer}>
          <Text style={styles.currencySymbol}>R$</Text>
          <TextInput style={[styles.amountInput, { color: colors.text }]} placeholder="0,00" placeholderTextColor={colors.subText} keyboardType="numeric" value={valor} onChangeText={handleValorChange} maxLength={15} />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Tabela</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScrollView}>
            {contas.filter(c => tipo === 'DESPESA' ? c.tipo !== 'RECEITA' : c.tipo === 'RECEITA').map((conta) => (
              <TouchableOpacity key={conta.id} style={[styles.chip, { backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', borderColor: isDarkMode ? '#334155' : '#e2e8f0' }, contaSelecionada === conta.nome && { backgroundColor: colors.accentLight, borderColor: colors.accent }]} onPress={() => setContaSelecionada(conta.nome)}>
                <Text style={[styles.chipText, { color: isDarkMode ? '#cbd5e1' : '#475569' }, contaSelecionada === conta.nome && { color: colors.accent, fontWeight: 'bold' }]}>{conta.nome}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Categoria</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScrollView}>
            {(tipo === 'DESPESA' ? TAGS_DESPESA : TAGS_RECEITA).map((tag) => (
              <TouchableOpacity key={tag} style={[styles.chip, { backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', borderColor: isDarkMode ? '#334155' : '#e2e8f0' }, tagSelecionada === tag && { backgroundColor: colors.accentLight, borderColor: colors.accent }]} onPress={() => setTagSelecionada(tag)}>
                <Text style={[styles.chipText, { color: isDarkMode ? '#cbd5e1' : '#475569' }, tagSelecionada === tag && { color: colors.accent, fontWeight: 'bold' }]}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {tagSelecionada.includes('Outros') && (
          <View style={styles.formGroup}><TextInput style={[styles.input, { backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc', borderColor: isDarkMode ? '#334155' : '#e2e8f0', color: colors.text }]} placeholderTextColor={colors.subText} placeholder="Nome da Categoria..." value={categoriaCustomizada} onChangeText={setCategoriaCustomizada} /></View>
        )}

        <View style={styles.formGroup}><Text style={[styles.label, { color: colors.text }]}>Descrição</Text><TextInput style={[styles.input, { backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc', borderColor: isDarkMode ? '#334155' : '#e2e8f0', color: colors.text }]} placeholderTextColor={colors.subText} placeholder={tipo === 'DESPESA' ? "Ex: Aluguel..." : "Ex: Salário..."} value={descricao} onChangeText={setDescricao} /></View>
        
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Data</Text>
          <TouchableOpacity style={[styles.input, { backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc', borderColor: isDarkMode ? '#334155' : '#e2e8f0', justifyContent: 'center' }]} onPress={() => setShowDatePicker(true)}>
            <Text style={{ fontSize: 15, color: colors.text }}>{dataAlvo.toLocaleDateString('pt-BR')}</Text>
          </TouchableOpacity>
          {showDatePicker && <DateTimePicker themeVariant={isDarkMode ? "dark" : "light"} value={dataAlvo} mode="date" display="default" onChange={onChangeDate} />}
        </View>

        {tipo === 'DESPESA' && !isContaTerceiros && (
          <View style={[styles.toggleGroup, { backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', borderColor: isDarkMode ? '#334155' : '#e2e8f0' }]}>
            <View style={styles.toggleHeader}><Text style={[styles.label, { color: colors.text, marginBottom: 0 }]}>Compra para outra pessoa?</Text><Switch value={isTerceiro} onValueChange={setIsTerceiro} trackColor={{ false: isDarkMode ? '#475569' : '#cbd5e1', true: '#fbcfe8' }} thumbColor={isTerceiro ? '#ec4899' : '#f8fafc'} /></View>
            {isTerceiro && <TextInput style={[styles.input, { marginTop: 12, backgroundColor: isDarkMode ? '#0f172a' : '#fff', color: colors.text, borderColor: isDarkMode ? '#475569' : '#e2e8f0' }]} placeholderTextColor={colors.subText} placeholder="Quem deve pagar?" value={nomeTerceiro} onChangeText={setNomeTerceiro} />}
          </View>
        )}

      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: isDarkMode ? '#334155' : '#f1f5f9' }]}>
        <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.accent }, isLoading && { opacity: 0.7 }]} onPress={handleSalvar} disabled={isLoading}><Text style={styles.saveButtonText}>Salvar Alterações</Text></TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: Platform.OS === 'ios' ? 60 : 50, borderBottomWidth: 1 }, closeBtn: { width: 40, height: 40, justifyContent: 'center' }, headerTitle: { fontSize: 18, fontWeight: 'bold' }, scrollContent: { padding: 20, paddingBottom: 60 }, typeSelector: { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 24 }, typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' }, typeBtnDespesa: { backgroundColor: '#ef4444', elevation: 2 }, typeBtnReceita: { backgroundColor: '#10b981', elevation: 2 }, typeText: { fontSize: 14, fontWeight: '600' }, typeTextActive: { color: '#ffffff' }, amountContainer: { alignItems: 'center', marginBottom: 28 }, currencySymbol: { fontSize: 16, color: '#9ca3af', marginBottom: 2 }, amountInput: { fontSize: 44, fontWeight: 'bold', textAlign: 'center', minWidth: 180 }, formGroup: { marginBottom: 20 }, label: { fontSize: 14, fontWeight: '600', marginBottom: 8 }, input: { borderWidth: 1, borderRadius: 12, padding: 16, fontSize: 15 }, chipScrollView: { flexDirection: 'row', marginTop: 4, marginHorizontal: -20, paddingHorizontal: 20 }, chip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, marginRight: 8, borderWidth: 1}, chipText: { fontSize: 14, fontWeight: '500' }, toggleGroup: { marginBottom: 16, borderRadius: 12, padding: 16, borderWidth: 1 }, toggleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, footer: { padding: 20, borderTopWidth: 1 }, saveButton: { borderRadius: 12, paddingVertical: 16, alignItems: 'center' }, saveButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});