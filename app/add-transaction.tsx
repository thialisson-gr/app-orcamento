// app/add-transaction.tsx
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { AccountPickerModal } from '../components/AccountPickerModal';
import { CategorySelector, TAGS_DESPESA, TAGS_RECEITA } from '../components/CategorySelector';
import { TransactionTypeSelector } from '../components/TransactionTypeSelector';
import { useAccounts } from '../hooks/useAccounts';
import { useIdentity } from '../hooks/useIdentity'; // 👈 Importado
import { useTheme } from '../hooks/useTheme';
import { salvarTransacaoNoFirebase } from '../services/firebase/firestore';
import { notificarAcao } from '../services/notifications'; // 👈 Importado

export default function AddTransactionModal() {
  const params = useLocalSearchParams();
  const contaPreSelecionada = params.contaPreSelecionada as string;
  
  const { contas, loadingContas } = useAccounts();
  const { colors, isDarkMode } = useTheme(); 
  const { perfil } = useIdentity(); // 👈 Puxando quem está logado
  
  const [tipo, setTipo] = useState<'DESPESA' | 'RECEITA'>('DESPESA');
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataAlvo, setDataAlvo] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [contaSelecionada, setContaSelecionada] = useState('');
  const [modalTabelasVisible, setModalTabelasVisible] = useState(false);
  
  const [tagSelecionada, setTagSelecionada] = useState(TAGS_DESPESA[0]);
  const [categoriaCustomizada, setCategoriaCustomizada] = useState('');
  
  const [modoRepeticao, setModoRepeticao] = useState<'UNICA' | 'PARCELADA' | 'FIXA'>('UNICA');
  const [qtdParcelas, setQtdParcelas] = useState('2');
  const [mesesProjecao, setMesesProjecao] = useState('12');
  
  const [isLoading, setIsLoading] = useState(false);
  const jaInicializou = useRef(false);

  useEffect(() => {
    if (!loadingContas && contas.length === 0) {
      Alert.alert(
        'Nenhuma Tabela',
        'Você precisa criar uma tabela antes de registrar movimentações.',
        [
          { text: 'Voltar', style: 'cancel', onPress: () => router.back() },
          { text: 'Criar Tabela', onPress: () => router.replace('/add-account') }
        ]
      );
    }
  }, [contas, loadingContas]);

  useEffect(() => { 
    if (!jaInicializou.current && contas.length > 0) {
      if (contaPreSelecionada) {
        setContaSelecionada(contaPreSelecionada);
        const contaAlvo = contas.find(c => c.nome === contaPreSelecionada);
        if (contaAlvo && contaAlvo.tipo === 'RECEITA') {
          setTipo('RECEITA');
          setTagSelecionada(TAGS_RECEITA[0]); 
        }
      }
      jaInicializou.current = true;
    }
  }, [contas, contaPreSelecionada]);

  const handleValorChange = (t: string) => {
    const n = t.replace(/\D/g, '');
    if (!n) return setValor('');
    setValor((Number(n) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (event.type === 'dismissed') return; 
    if (selectedDate) setDataAlvo(selectedDate);
  };

  const handleSalvar = async () => {
    if (!valor || !descricao || !contaSelecionada || !dataAlvo) {
      return Alert.alert('Atenção', 'Preencha o valor, a descrição, a tabela e a data.');
    }
    
    setIsLoading(true);
    const tagFinal = tagSelecionada.includes('Outros') && categoriaCustomizada ? categoriaCustomizada : tagSelecionada;
    const isParcelado = modoRepeticao === 'PARCELADA';
    const isFixo = modoRepeticao === 'FIXA';

    const res = await salvarTransacaoNoFirebase({
      tipo, 
      valorFormatado: valor, 
      descricao, 
      contaSelecionada, 
      tagSelecionada: tagFinal, 
      isParcelado, 
      qtdParcelas, 
      isFixo, 
      mesesProjecao, 
      isTerceiro: false, 
      nomeTerceiro: '', 
      dataPagamento: dataAlvo.toLocaleDateString('pt-BR') 
    });
    
    setIsLoading(false);
    if (res.sucesso) {
      // 👇 DISPARA A NOTIFICAÇÃO SE FOR SUCESSO
      const contaCompleta = contas.find(c => c.nome === contaSelecionada);
      if (contaCompleta && perfil) {
        notificarAcao(perfil as 'EU' | 'RAY', contaCompleta, 'adicionou', descricao);
      }
      router.back();
    } else {
      Alert.alert('Erro', 'Falha ao salvar a transação.');
    }
  };

  const contasParaExibir = contas.filter(c => tipo === 'DESPESA' ? c.tipo !== 'RECEITA' : c.tipo === 'RECEITA');

  return (
    <View style={{ flex: 1, backgroundColor: colors.card }}>
      <View style={[styles.header, { borderBottomColor: isDarkMode ? '#334155' : '#f1f5f9' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} activeOpacity={0.7}><Ionicons name="close" size={26} color={colors.subText} /></TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Nova Transação</Text>
        <View style={{ width: 40 }} /> 
      </View>
      
      <KeyboardAwareScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" enableOnAndroid={true} extraScrollHeight={Platform.OS === 'ios' ? 20 : 0}>
        <TransactionTypeSelector 
          tipo={tipo} 
          onChange={(novoTipo) => {
            setTipo(novoTipo);
            setTagSelecionada(novoTipo === 'DESPESA' ? TAGS_DESPESA[0] : TAGS_RECEITA[0]);
            setModoRepeticao('UNICA');
            setContaSelecionada(''); 
          }} 
        />

        <View style={styles.amountContainer}>
          <Text style={[styles.currencySymbol, { color: tipo === 'RECEITA' ? '#10b981' : '#ef4444' }]}>R$</Text>
          <TextInput style={[styles.amountInput, { color: tipo === 'RECEITA' ? '#10b981' : '#ef4444' }]} placeholder="0,00" placeholderTextColor={isDarkMode ? '#334155' : '#cbd5e1'} keyboardType="numeric" value={valor} onChangeText={handleValorChange} maxLength={15} caretHidden={true} />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Tabela</Text>
          <TouchableOpacity style={[styles.inputDropdown, { backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc', borderColor: isDarkMode ? '#334155' : '#e2e8f0' }]} onPress={() => setModalTabelasVisible(true)} activeOpacity={0.7}>
            <Text style={{ fontSize: 16, color: contaSelecionada ? colors.text : colors.subText, fontWeight: contaSelecionada ? '600' : 'normal' }}>{contaSelecionada || "Selecione uma tabela..."}</Text>
            <Ionicons name="chevron-down" size={20} color={colors.subText} />
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Categoria</Text>
          <CategorySelector tipo={tipo} tagSelecionada={tagSelecionada} onSelectTag={setTagSelecionada} />
        </View>

        {tagSelecionada.includes('Outros') && (
          <View style={styles.formGroup}>
            <TextInput style={[styles.input, { backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc', borderColor: isDarkMode ? '#334155' : '#e2e8f0', color: colors.text }]} placeholderTextColor={colors.subText} placeholder="Qual o nome da categoria?" value={categoriaCustomizada} onChangeText={setCategoriaCustomizada} />
          </View>
        )}

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Descrição</Text>
          <TextInput style={[styles.input, { backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc', borderColor: isDarkMode ? '#334155' : '#e2e8f0', color: colors.text }]} placeholderTextColor={colors.subText} placeholder={tipo === 'DESPESA' ? "Ex: Compras do mês..." : "Ex: Salário..."} value={descricao} onChangeText={setDescricao} />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Data de Pagamento</Text>
          <TouchableOpacity style={[styles.input, { backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc', borderColor: isDarkMode ? '#334155' : '#e2e8f0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]} onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
            <Text style={{ fontSize: 16, color: dataAlvo ? colors.text : colors.subText, fontWeight: dataAlvo ? '500' : 'normal' }}>{dataAlvo ? dataAlvo.toLocaleDateString('pt-BR') : "Selecione uma data..."}</Text>
            <Ionicons name="calendar-outline" size={20} color={colors.subText} />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker themeVariant={isDarkMode ? "dark" : "light"} value={dataAlvo || new Date()} mode="date" display="default" onChange={onChangeDate} />
          )}
        </View>

        {tipo === 'DESPESA' && (
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Forma de Pagamento</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={[styles.modoBtn, { backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', borderColor: isDarkMode ? '#334155' : '#e2e8f0' }, modoRepeticao === 'UNICA' && { backgroundColor: colors.accentLight, borderColor: colors.accent }]} onPress={() => setModoRepeticao('UNICA')}>
                <Text style={[styles.modoBtnText, { color: isDarkMode ? '#cbd5e1' : '#64748b' }, modoRepeticao === 'UNICA' && { color: colors.accent, fontWeight: 'bold' }]}>Única</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modoBtn, { backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', borderColor: isDarkMode ? '#334155' : '#e2e8f0' }, modoRepeticao === 'PARCELADA' && { backgroundColor: colors.accentLight, borderColor: colors.accent }]} onPress={() => setModoRepeticao('PARCELADA')}>
                <Text style={[styles.modoBtnText, { color: isDarkMode ? '#cbd5e1' : '#64748b' }, modoRepeticao === 'PARCELADA' && { color: colors.accent, fontWeight: 'bold' }]}>Parcelada</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modoBtn, { backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', borderColor: isDarkMode ? '#334155' : '#e2e8f0' }, modoRepeticao === 'FIXA' && { backgroundColor: colors.accentLight, borderColor: colors.accent }]} onPress={() => setModoRepeticao('FIXA')}>
                <Text style={[styles.modoBtnText, { color: isDarkMode ? '#cbd5e1' : '#64748b' }, modoRepeticao === 'FIXA' && { color: colors.accent, fontWeight: 'bold' }]}>Mensal Fixa</Text>
              </TouchableOpacity>
            </View>

            {modoRepeticao === 'PARCELADA' && (
              <View style={{ marginTop: 16 }}>
                <TextInput style={[styles.input, { backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc', color: colors.text, borderColor: isDarkMode ? '#334155' : '#e2e8f0' }]} placeholderTextColor={colors.subText} placeholder="Quantas parcelas no total? Ex: 5" keyboardType="numeric" value={qtdParcelas} onChangeText={setQtdParcelas} />
              </View>
            )}
            
            {modoRepeticao === 'FIXA' && (
              <View style={{ marginTop: 16 }}>
                <TextInput style={[styles.input, { backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc', color: colors.text, borderColor: isDarkMode ? '#334155' : '#e2e8f0' }]} placeholderTextColor={colors.subText} placeholder="Projetar por quantos meses? Ex: 12" keyboardType="numeric" value={mesesProjecao} onChangeText={setMesesProjecao} />
              </View>
            )}
          </View>
        )}
      </KeyboardAwareScrollView>

      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: isDarkMode ? '#334155' : '#f1f5f9' }]}>
        <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.accent }, isLoading && { opacity: 0.7 }]} onPress={handleSalvar} disabled={isLoading} activeOpacity={0.8}>
          <Text style={styles.saveButtonText}>Salvar Transação</Text>
        </TouchableOpacity>
      </View>

      <AccountPickerModal visible={modalTabelasVisible} onClose={() => setModalTabelasVisible(false)} contas={contasParaExibir} contaSelecionada={contaSelecionada} onSelectConta={(nome) => { setContaSelecionada(nome); setModalTabelasVisible(false); }} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: Platform.OS === 'ios' ? 60 : 50, borderBottomWidth: 1 }, 
  closeBtn: { width: 40, height: 40, justifyContent: 'center' }, 
  headerTitle: { fontSize: 18, fontWeight: 'bold' }, 
  scrollContent: { paddingVertical: 24, paddingBottom: 60 }, 
  amountContainer: { alignItems: 'center', marginBottom: 40 }, 
  currencySymbol: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 }, 
  amountInput: { fontSize: 52, fontWeight: '800', textAlign: 'center', minWidth: 200, letterSpacing: -1 }, 
  formGroup: { marginBottom: 24, paddingHorizontal: 24 }, 
  label: { fontSize: 13, fontWeight: 'bold', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }, 
  input: { borderWidth: 1, borderRadius: 16, padding: 16, fontSize: 16 }, 
  inputDropdown: { borderWidth: 1, borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modoBtn: { flex: 1, paddingVertical: 14, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  modoBtnText: { fontSize: 13, fontWeight: '600' },
  footer: { padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, borderTopWidth: 1 }, 
  saveButton: { borderRadius: 20, paddingVertical: 18, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6 }, 
  saveButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' }, 
});