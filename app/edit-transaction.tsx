// app/edit-transaction.tsx
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Platform, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { AccountPickerModal } from '../components/AccountPickerModal';
import { CategorySelector, TAGS_DESPESA, TAGS_RECEITA } from '../components/CategorySelector';
import { TransactionTypeSelector } from '../components/TransactionTypeSelector';
import { useAccounts } from '../hooks/useAccounts';
import { useTheme } from '../hooks/useTheme';
import { useTransactions } from '../hooks/useTransactions';
import { atualizarTransacaoNoFirebase, atualizarTransacoesRecorrentes } from '../services/firebase/firestore';

export default function EditTransactionScreen() {
  const params = useLocalSearchParams();
  const id = params.id as string;
  
  const { contas } = useAccounts();
  const { transacoes } = useTransactions();
  const { colors, isDarkMode } = useTheme(); 

  const [tipo, setTipo] = useState<'DESPESA' | 'RECEITA'>('DESPESA');
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataAlvo, setDataAlvo] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Modal de Tabelas
  const [contaSelecionada, setContaSelecionada] = useState('');
  const [modalTabelasVisible, setModalTabelasVisible] = useState(false);
  
  const [tagSelecionada, setTagSelecionada] = useState('');
  const [categoriaCustomizada, setCategoriaCustomizada] = useState('');
  const [isTerceiro, setIsTerceiro] = useState(false);
  const [nomeTerceiro, setNomeTerceiro] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

      jaInicializou.current = true;
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
    if (!valor || !descricao || !contaSelecionada) return Alert.alert('Atenção', 'Preencha o valor, a descrição e a tabela.');
    
    const isRecorrente = params.isRecorrente === 'true';
    const parentId = params.parentId as string;
    const tagFinal = tagSelecionada.includes('Outros') && categoriaCustomizada ? categoriaCustomizada : tagSelecionada;

    const salvarUnico = async () => {
      setIsLoading(true);
      const res = await atualizarTransacaoNoFirebase(id, {
        tipo, valorFormatado: valor, descricao, contaSelecionada, tagSelecionada: tagFinal, isTerceiro: tipo === 'DESPESA' ? isTerceiro : false, nomeTerceiro, dataPagamento: dataAlvo.toLocaleDateString('pt-BR') 
      });
      setIsLoading(false);
      if (res.sucesso) router.back(); else Alert.alert('Erro', 'Falha ao atualizar.');
    };

    if (isRecorrente && parentId) {
      Alert.alert('Editar Recorrência', 'Esta transação faz parte de um parcelamento/assinatura. Deseja aplicar as alterações para as futuras também?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Apenas Esta', onPress: salvarUnico },
        { text: 'Esta e Futuras', onPress: async () => {
            setIsLoading(true);
            const dataReferencia = new Date(params.dataOriginal as string).getTime();
            
            const futurasIds = transacoes.filter(t => {
              if (t.id === id) return false; 
              const tParentId = t.isInstallment ? t.installmentDetails?.parentId : t.fixedDetails?.parentId;
              const tData = new Date(t.paymentDate || t.date).getTime();
              return tParentId === parentId && tData >= dataReferencia;
            }).map(t => t.id);

            const res = await atualizarTransacoesRecorrentes(id, futurasIds, {
              tipo, valorFormatado: valor, descricao, contaSelecionada, tagSelecionada: tagFinal, isTerceiro: tipo === 'DESPESA' ? isTerceiro : false, nomeTerceiro, dataPagamento: dataAlvo.toLocaleDateString('pt-BR')
            });

            setIsLoading(false);
            if (res.sucesso) router.back(); else Alert.alert('Erro', 'Falha ao atualizar em massa.');
        }}
      ]);
    } else {
      salvarUnico();
    }
  };

  const contasParaExibir = contas.filter(c => tipo === 'DESPESA' ? c.tipo !== 'RECEITA' : c.tipo === 'RECEITA');

  return (
    <View style={{ flex: 1, backgroundColor: colors.card }}>
      
      {/* CABEÇALHO */}
      <View style={[styles.header, { borderBottomColor: isDarkMode ? '#334155' : '#f1f5f9' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} activeOpacity={0.7}><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Editar Transação</Text>
        <View style={{ width: 40 }} /> 
      </View>
      
      <KeyboardAwareScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" enableOnAndroid={true} extraScrollHeight={Platform.OS === 'ios' ? 20 : 0}>
        
        {/* TIPO: DESPESA / RECEITA (PÍLULA) */}
        <TransactionTypeSelector 
          tipo={tipo} 
          onChange={(novoTipo) => {
            setTipo(novoTipo);
            setTagSelecionada(novoTipo === 'DESPESA' ? TAGS_DESPESA[0] : TAGS_RECEITA[0]);
          }} 
        />

        {/* VALOR (COR DINÂMICA) */}
        <View style={styles.amountContainer}>
          <Text style={[styles.currencySymbol, { color: tipo === 'RECEITA' ? '#10b981' : '#ef4444' }]}>R$</Text>
          <TextInput 
            style={[styles.amountInput, { color: tipo === 'RECEITA' ? '#10b981' : '#ef4444' }]} 
            placeholder="0,00" 
            placeholderTextColor={isDarkMode ? '#334155' : '#cbd5e1'} 
            keyboardType="numeric" 
            value={valor} 
            onChangeText={handleValorChange} 
            maxLength={15} 
            caretHidden={true} 
          />
        </View>

        {/* TABELA (MENU SELETOR MODERNO) */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Tabela</Text>
          <TouchableOpacity 
            style={[styles.inputDropdown, { backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc', borderColor: isDarkMode ? '#334155' : '#e2e8f0' }]} 
            onPress={() => setModalTabelasVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 16, color: contaSelecionada ? colors.text : colors.subText, fontWeight: contaSelecionada ? '600' : 'normal' }}>
              {contaSelecionada || "Selecione uma tabela..."}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.subText} />
          </TouchableOpacity>
        </View>

        {/* CATEGORIA (GRADE/WRAP AO INVÉS DE SCROLL) */}
        {/* CATEGORIA */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Categoria</Text>
          <CategorySelector 
            tipo={tipo} 
            tagSelecionada={tagSelecionada} 
            onSelectTag={setTagSelecionada} 
          />
        </View>

        {tagSelecionada.includes('Outros') && (
          <View style={styles.formGroup}>
            <TextInput style={[styles.input, { backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc', borderColor: isDarkMode ? '#334155' : '#e2e8f0', color: colors.text }]} placeholderTextColor={colors.subText} placeholder="Nome da Categoria..." value={categoriaCustomizada} onChangeText={setCategoriaCustomizada} />
          </View>
        )}

        {/* DESCRIÇÃO E DATA */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Descrição</Text>
          <TextInput style={[styles.input, { backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc', borderColor: isDarkMode ? '#334155' : '#e2e8f0', color: colors.text }]} placeholderTextColor={colors.subText} placeholder={tipo === 'DESPESA' ? "Ex: Aluguel..." : "Ex: Salário..."} value={descricao} onChangeText={setDescricao} />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Data de Pagamento</Text>
          <TouchableOpacity style={[styles.input, { backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc', borderColor: isDarkMode ? '#334155' : '#e2e8f0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]} onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
            <Text style={{ fontSize: 16, color: colors.text, fontWeight: '500' }}>{dataAlvo.toLocaleDateString('pt-BR')}</Text>
            <Ionicons name="calendar-outline" size={20} color={colors.subText} />
          </TouchableOpacity>
          {showDatePicker && <DateTimePicker themeVariant={isDarkMode ? "dark" : "light"} value={dataAlvo} mode="date" display="default" onChange={onChangeDate} />}
        </View>

        {/* TERCEIROS (SQUIRCLE) */}
        {tipo === 'DESPESA' && !isContaTerceiros && (
          <View style={[styles.toggleGroup, { backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', borderColor: isDarkMode ? '#334155' : '#e2e8f0' }]}>
            <View style={styles.toggleHeader}>
              <Text style={[styles.label, { color: colors.text, marginBottom: 0 }]}>Compra para outra pessoa?</Text>
              <Switch value={isTerceiro} onValueChange={setIsTerceiro} trackColor={{ false: isDarkMode ? '#475569' : '#cbd5e1', true: '#fbcfe8' }} thumbColor={isTerceiro ? '#ec4899' : '#f8fafc'} />
            </View>
            {isTerceiro && <TextInput style={[styles.input, { marginTop: 16, backgroundColor: isDarkMode ? '#0f172a' : '#fff', color: colors.text, borderColor: isDarkMode ? '#475569' : '#e2e8f0' }]} placeholderTextColor={colors.subText} placeholder="Quem deve pagar?" value={nomeTerceiro} onChangeText={setNomeTerceiro} />}
          </View>
        )}

      </KeyboardAwareScrollView>

      {/* RODAPÉ E BOTÃO SALVAR */}
      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: isDarkMode ? '#334155' : '#f1f5f9' }]}>
        <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.accent }, isLoading && { opacity: 0.7 }]} onPress={handleSalvar} disabled={isLoading} activeOpacity={0.8}>
          <Text style={styles.saveButtonText}>Salvar Alterações</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL DE SELEÇÃO DE TABELAS (COMPONENTE) */}
      <AccountPickerModal 
        visible={modalTabelasVisible} 
        onClose={() => setModalTabelasVisible(false)} 
        contas={contasParaExibir} 
        contaSelecionada={contaSelecionada} 
        onSelectConta={(nome) => {
          setContaSelecionada(nome);
          setModalTabelasVisible(false);
        }} 
      />

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
  
  toggleGroup: { marginBottom: 20, borderRadius: 20, padding: 20, borderWidth: 1, marginHorizontal: 24 }, 
  toggleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, 
  
  footer: { padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, borderTopWidth: 1 }, 
  saveButton: { borderRadius: 20, paddingVertical: 18, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6 }, 
  saveButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  });