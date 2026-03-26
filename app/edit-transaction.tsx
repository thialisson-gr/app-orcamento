// app/add-transaction.tsx
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAccounts } from '../hooks/useAccounts';
import { useTheme } from '../hooks/useTheme';
import { salvarTransacaoNoFirebase } from '../services/firebase/firestore';

const TAGS_DESPESA = ['🛒 Super', '🍔 Lazer', '🏠 Casa', '🚗 Transp.', '🏥 Saúde', '🛍️ Compras', '⚡ Contas', '🏷️ Outros'];
const TAGS_RECEITA = ['💰 Salário', '💸 Pix', '🏦 Transf.', '📈 Rends.', '🎁 Outros'];

export default function AddTransactionModal() {
  const { contas } = useAccounts();
  const { colors, isDarkMode } = useTheme(); 
  const [tipo, setTipo] = useState<'DESPESA' | 'RECEITA'>('DESPESA');
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataAlvo, setDataAlvo] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [contaSelecionada, setContaSelecionada] = useState('');
  const [tagSelecionada, setTagSelecionada] = useState(TAGS_DESPESA[0]);
  const [categoriaCustomizada, setCategoriaCustomizada] = useState('');
  const [isParcelado, setIsParcelado] = useState(false);
  const [qtdParcelas, setQtdParcelas] = useState('2');
  const [isFixo, setIsFixo] = useState(false);
  const [mesesProjecao, setMesesProjecao] = useState('12');
  const [isTerceiro, setIsTerceiro] = useState(false);
  const [nomeTerceiro, setNomeTerceiro] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => { if (contas.length > 0 && !contaSelecionada) setContaSelecionada(contas[0].nome); }, [contas]);

  const handleValorChange = (t: string) => {
    const n = t.replace(/\D/g, '');
    if (!n) return setValor('');
    setValor((Number(n) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  };

  const handleSalvar = async () => {
    if (!valor || !descricao) return Alert.alert('Atenção', 'Preencha o valor e a descrição.');
    setIsLoading(true);
    const tagFinal = tagSelecionada.includes('Outros') && categoriaCustomizada ? categoriaCustomizada : tagSelecionada;
    const res = await salvarTransacaoNoFirebase({
      tipo, valorFormatado: valor, descricao, contaSelecionada, tagSelecionada: tagFinal, isParcelado, qtdParcelas, isFixo, mesesProjecao, isTerceiro: tipo === 'DESPESA' ? isTerceiro : false, nomeTerceiro, dataPagamento: dataAlvo.toLocaleDateString('pt-BR') 
    });
    setIsLoading(false);
    if (res.sucesso) router.back(); else Alert.alert('Erro', 'Falha ao salvar.');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={[styles.header, { borderBottomColor: isDarkMode ? '#374151' : '#f1f5f9' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} activeOpacity={0.7}><Ionicons name="close" size={20} color={colors.subText} /></TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Nova Transação</Text>
        <View style={{ width: 32 }} /> 
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={[styles.typeSelector, { backgroundColor: isDarkMode ? '#111827' : '#f1f5f9' }]}>
          <TouchableOpacity style={[styles.typeBtn, tipo === 'DESPESA' && styles.typeBtnDespesa]} onPress={() => {setTipo('DESPESA'); setTagSelecionada(TAGS_DESPESA[0]);}}><Text style={[styles.typeText, { color: isDarkMode ? '#9ca3af' : '#64748b' }, tipo === 'DESPESA' && styles.typeTextActive]}>Despesa</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.typeBtn, tipo === 'RECEITA' && styles.typeBtnReceita]} onPress={() => {setTipo('RECEITA'); setTagSelecionada(TAGS_RECEITA[0]);}}><Text style={[styles.typeText, { color: isDarkMode ? '#9ca3af' : '#64748b' }, tipo === 'RECEITA' && styles.typeTextActive]}>Receita</Text></TouchableOpacity>
        </View>

        <View style={styles.amountContainer}>
          <Text style={styles.currencySymbol}>R$</Text>
          {/* Valor Gigante Reduzido um pouco para caber melhor */}
          <TextInput style={[styles.amountInput, { color: colors.text }]} placeholder="0,00" placeholderTextColor={colors.subText} keyboardType="numeric" value={valor} onChangeText={handleValorChange} maxLength={15} />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Tabela</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScrollView}>
            {contas.filter(c => tipo === 'DESPESA' ? c.tipo !== 'RECEITA' : c.tipo === 'RECEITA').map((conta) => (
              <TouchableOpacity key={conta.id} style={[styles.chip, { backgroundColor: isDarkMode ? '#374151' : '#f8fafc', borderColor: isDarkMode ? '#475569' : '#e2e8f0' }, contaSelecionada === conta.nome && { backgroundColor: colors.accentLight, borderColor: colors.accent }]} onPress={() => setContaSelecionada(conta.nome)}>
                <Text style={[styles.chipText, { color: isDarkMode ? '#d1d5db' : '#475569' }, contaSelecionada === conta.nome && { color: colors.accent, fontWeight: 'bold' }]}>{conta.nome}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Categoria</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScrollView}>
            {(tipo === 'DESPESA' ? TAGS_DESPESA : TAGS_RECEITA).map((tag) => (
              <TouchableOpacity key={tag} style={[styles.chip, { backgroundColor: isDarkMode ? '#374151' : '#f8fafc', borderColor: isDarkMode ? '#475569' : '#e2e8f0' }, tagSelecionada === tag && { backgroundColor: colors.accentLight, borderColor: colors.accent }]} onPress={() => setTagSelecionada(tag)}>
                <Text style={[styles.chipText, { color: isDarkMode ? '#d1d5db' : '#475569' }, tagSelecionada === tag && { color: colors.accent, fontWeight: 'bold' }]}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {tagSelecionada.includes('Outros') && (
          <View style={styles.formGroup}><TextInput style={[styles.input, { backgroundColor: isDarkMode ? '#111827' : '#f8fafc', borderColor: isDarkMode ? '#374151' : '#e2e8f0', color: colors.text }]} placeholderTextColor={colors.subText} placeholder="Nome da Categoria..." value={categoriaCustomizada} onChangeText={setCategoriaCustomizada} /></View>
        )}

        <View style={styles.formGroup}><Text style={[styles.label, { color: colors.text }]}>Descrição</Text><TextInput style={[styles.input, { backgroundColor: isDarkMode ? '#111827' : '#f8fafc', borderColor: isDarkMode ? '#374151' : '#e2e8f0', color: colors.text }]} placeholderTextColor={colors.subText} placeholder="Ex: Aluguel..." value={descricao} onChangeText={setDescricao} /></View>
        
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Data</Text>
          <TouchableOpacity style={[styles.input, { backgroundColor: isDarkMode ? '#111827' : '#f8fafc', borderColor: isDarkMode ? '#374151' : '#e2e8f0', justifyContent: 'center' }]} onPress={() => setShowDatePicker(true)}>
            <Text style={{ fontSize: 14, color: colors.text }}>{dataAlvo.toLocaleDateString('pt-BR')}</Text>
          </TouchableOpacity>
          {showDatePicker && <DateTimePicker themeVariant={isDarkMode ? "dark" : "light"} value={dataAlvo} mode="date" display="default" onChange={onChangeDate} />}
        </View>

        <View style={[styles.toggleGroup, { backgroundColor: isDarkMode ? '#1f2937' : '#f8fafc', borderColor: isDarkMode ? '#374151' : '#e2e8f0' }]}>
          <View style={styles.toggleHeader}><Text style={[styles.label, { color: colors.text, marginBottom: 0 }]}>Recorrente?</Text><Switch value={isFixo} onValueChange={(v) => {setIsFixo(v); if(v) setIsParcelado(false);}} /></View>
          {isFixo && <TextInput style={[styles.input, { marginTop: 12, backgroundColor: isDarkMode ? '#111827' : '#fff', color: colors.text, borderColor: isDarkMode ? '#374151' : '#e2e8f0' }]} placeholderTextColor={colors.subText} placeholder="Quantos meses? Ex: 12" keyboardType="numeric" value={mesesProjecao} onChangeText={setMesesProjecao} />}
        </View>

        {tipo === 'DESPESA' && (
          <View style={[styles.toggleGroup, { backgroundColor: isDarkMode ? '#1f2937' : '#f8fafc', borderColor: isDarkMode ? '#374151' : '#e2e8f0' }]}>
            <View style={styles.toggleHeader}><Text style={[styles.label, { color: colors.text, marginBottom: 0 }]}>Parcelado?</Text><Switch value={isParcelado} onValueChange={(v) => {setIsParcelado(v); if(v) setIsFixo(false);}} /></View>
            {isParcelado && <TextInput style={[styles.input, { marginTop: 12, backgroundColor: isDarkMode ? '#111827' : '#fff', color: colors.text, borderColor: isDarkMode ? '#374151' : '#e2e8f0' }]} placeholderTextColor={colors.subText} placeholder="Quantas parcelas?" keyboardType="numeric" value={qtdParcelas} onChangeText={setQtdParcelas} />}
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: isDarkMode ? '#374151' : '#f1f5f9' }]}>
        <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.accent }, isLoading && { opacity: 0.7 }]} onPress={handleSalvar} disabled={isLoading}><Text style={styles.saveButtonText}>Guardar</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 }, closeBtn: { width: 32, height: 32, justifyContent: 'center' }, headerTitle: { fontSize: 16, fontWeight: 'bold' }, scrollContent: { padding: 16, paddingBottom: 40 }, typeSelector: { flexDirection: 'row', borderRadius: 10, padding: 4, marginBottom: 20 }, typeBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' }, typeBtnDespesa: { backgroundColor: '#ef4444', elevation: 1 }, typeBtnReceita: { backgroundColor: '#10b981', elevation: 1 }, typeText: { fontSize: 13, fontWeight: '600' }, typeTextActive: { color: '#ffffff' }, amountContainer: { alignItems: 'center', marginBottom: 24 }, currencySymbol: { fontSize: 16, color: '#9ca3af', marginBottom: 2 }, amountInput: { fontSize: 40, fontWeight: 'bold', textAlign: 'center', minWidth: 180 }, formGroup: { marginBottom: 16 }, label: { fontSize: 13, fontWeight: '600', marginBottom: 6 }, input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14 }, chipScrollView: { flexDirection: 'row', marginTop: 4, marginHorizontal: -16, paddingHorizontal: 16 }, chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16, marginRight: 8, borderWidth: 1}, chipText: { fontSize: 13, fontWeight: '500' }, toggleGroup: { marginBottom: 16, borderRadius: 10, padding: 12, borderWidth: 1 }, toggleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, footer: { padding: 16, borderTopWidth: 1 }, saveButton: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' }, saveButtonText: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },
});