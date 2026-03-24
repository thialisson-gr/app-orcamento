// app/add-transaction.tsx
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAccounts } from '../hooks/useAccounts';
import { salvarTransacaoNoFirebase } from '../services/firebase/firestore';

// 👇 Adicionamos "Outros" também nas despesas
const TAGS_DESPESA = ['🛒 Supermercado', '🍔 Lazer', '🏠 Casa', '🚗 Transporte', '🏥 Saúde', '🛍️ Compras', '⚡ Contas Fixas', '🏷️ Outros'];
const TAGS_RECEITA = ['💰 Salário', '💸 Pix', '🏦 Transferência', '📈 Rendimentos', '🎁 Outros'];

export default function AddTransactionModal() {
  const { contas } = useAccounts();
  const [tipo, setTipo] = useState<'DESPESA' | 'RECEITA'>('DESPESA');
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  
  // 👇 Novos Estados para o Calendário
  const [dataAlvo, setDataAlvo] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [contaSelecionada, setContaSelecionada] = useState('');
  const [tagSelecionada, setTagSelecionada] = useState(TAGS_DESPESA[0]);
  
  // 👇 Novo Estado para Categoria Customizada
  const [categoriaCustomizada, setCategoriaCustomizada] = useState('');

  const [isParcelado, setIsParcelado] = useState(false);
  const [qtdParcelas, setQtdParcelas] = useState('2');
  const [isFixo, setIsFixo] = useState(false);
  const [mesesProjecao, setMesesProjecao] = useState('12');
  const [isTerceiro, setIsTerceiro] = useState(false);
  const [nomeTerceiro, setNomeTerceiro] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const contaAtual = contas.find(c => c.nome === contaSelecionada);
  const isContaTerceiros = contaAtual?.tipo === 'TERCEIROS';

  useEffect(() => {
    if (contas.length > 0 && contaSelecionada === '') setContaSelecionada(contas[0].nome);
  }, [contas]);

  useEffect(() => {
    if (isContaTerceiros) {
      setIsTerceiro(false);
      setNomeTerceiro('');
    }
  }, [isContaTerceiros]);

  const handleMudarTipo = (novoTipo: 'DESPESA' | 'RECEITA') => {
    setTipo(novoTipo);
    setTagSelecionada(novoTipo === 'DESPESA' ? TAGS_DESPESA[0] : TAGS_RECEITA[0]);
    setIsParcelado(false); 
    setCategoriaCustomizada('');
  };

  const handleToggleParcelado = (v: boolean) => { setIsParcelado(v); if (v) setIsFixo(false); };
  const handleToggleFixo = (v: boolean) => { setIsFixo(v); if (v) setIsParcelado(false); };

  const handleValorChange = (texto: string) => {
    const apenasNumeros = texto.replace(/\D/g, '');
    const valorDecimal = Number(apenasNumeros) / 100;
    if (apenasNumeros === '') return setValor('');
    setValor(valorDecimal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  };

  // 👇 Função para lidar com a escolha da data no Calendário
  const onChangeDate = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) setDataAlvo(selectedDate);
  };

  const handleSalvar = async () => {
    if (!valor || !descricao) return Alert.alert('Atenção', 'Preencha o valor e a descrição.');
    if (!contaSelecionada) return Alert.alert('Atenção', 'Selecione uma conta ou tabela.');

    // Define a tag final (Se escolheu "Outros" e digitou algo, usa o que digitou)
    const isOutros = tagSelecionada.includes('Outros');
    const tagFinal = (isOutros && categoriaCustomizada.trim() !== '') ? categoriaCustomizada : tagSelecionada;

    // Formata a data escolhida no calendário para DD/MM/AAAA para o banco ler
    const dataFormatada = dataAlvo.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

    setIsLoading(true);
    const resultado = await salvarTransacaoNoFirebase({
      tipo, valorFormatado: valor, descricao,
      contaSelecionada, 
      tagSelecionada: tagFinal, // 👈 Envia a tag mágica
      isParcelado, qtdParcelas, isFixo, mesesProjecao,
      isTerceiro: tipo === 'DESPESA' ? isTerceiro : false, nomeTerceiro, 
      dataPagamento: dataFormatada // 👈 Envia a data do calendário
    });
    setIsLoading(false);

    if (resultado.sucesso) router.back();
    else Alert.alert('Erro', 'Ocorreu um problema ao guardar.');
  };

  const categoriasAtuais = tipo === 'DESPESA' ? TAGS_DESPESA : TAGS_RECEITA;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} activeOpacity={0.7}><Ionicons name="close" size={24} color="#6b7280" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Nova Transação</Text>
        <View style={{ width: 40 }} /> 
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.typeSelector}>
          <TouchableOpacity style={[styles.typeBtn, tipo === 'DESPESA' && styles.typeBtnDespesa]} onPress={() => handleMudarTipo('DESPESA')} activeOpacity={0.8}><Text style={[styles.typeText, tipo === 'DESPESA' && styles.typeTextActive]}>Despesa</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.typeBtn, tipo === 'RECEITA' && styles.typeBtnReceita]} onPress={() => handleMudarTipo('RECEITA')} activeOpacity={0.8}><Text style={[styles.typeText, tipo === 'RECEITA' && styles.typeTextActive]}>Receita</Text></TouchableOpacity>
        </View>

        <View style={styles.amountContainer}>
          <Text style={styles.currencySymbol}>R$</Text>
          <TextInput style={styles.amountInput} placeholder="0,00" placeholderTextColor="#9ca3af" keyboardType="numeric" value={valor} onChangeText={handleValorChange} maxLength={15} />
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.label}>Conta / Tabela</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScrollView}>
            {contas.filter(c => tipo === 'DESPESA' ? c.tipo !== 'RECEITA' : c.tipo === 'RECEITA').length === 0 ? (
              <Text style={{ marginLeft: 20, color: '#9ca3af', fontStyle: 'italic' }}>Nenhuma tabela criada para este tipo.</Text>
            ) : (
              contas.filter(c => tipo === 'DESPESA' ? c.tipo !== 'RECEITA' : c.tipo === 'RECEITA').map((conta) => (
                <TouchableOpacity key={conta.id} style={[styles.chip, contaSelecionada === conta.nome && styles.chipSelected]} onPress={() => setContaSelecionada(conta.nome)} activeOpacity={0.7}>
                  <Text style={[styles.chipText, contaSelecionada === conta.nome && styles.chipTextSelected]}>{conta.nome}</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.label}>Categoria</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScrollView}>
            {categoriasAtuais.map((tag) => (
              <TouchableOpacity key={tag} style={[styles.chip, tagSelecionada === tag && styles.chipSelected]} onPress={() => setTagSelecionada(tag)} activeOpacity={0.7}>
                <Text style={[styles.chipText, tagSelecionada === tag && styles.chipTextSelected]}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 👇 NOVO: INPUT DA CATEGORIA CUSTOMIZADA */}
        {tagSelecionada.includes('Outros') && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Qual é a categoria?</Text>
            <TextInput style={styles.input} placeholder="Ex: Doação, Presente..." value={categoriaCustomizada} onChangeText={setCategoriaCustomizada} />
          </View>
        )}

        <View style={styles.formGroup}><Text style={styles.label}>Descrição</Text><TextInput style={styles.input} placeholder={tipo === 'DESPESA' ? "Ex: Internet, Aluguer..." : "Ex: Salário..."} value={descricao} onChangeText={setDescricao} /></View>
        
        {/* 👇 NOVO: CAMPO DE DATA COM CALENDÁRIO */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>{tipo === 'DESPESA' ? 'Data do Vencimento / Fatura' : 'Data do Recebimento'}</Text>
          <TouchableOpacity style={[styles.input, { justifyContent: 'center' }]} onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
            <Text style={{ fontSize: 16, color: '#1f2937' }}>
              {dataAlvo.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </Text>
          </TouchableOpacity>
          <Text style={styles.helperText}>O valor digitado no topo será o valor de CADA parcela.</Text>

          {showDatePicker && (
            <DateTimePicker
              value={dataAlvo}
              mode="date"
              display="default"
              onChange={onChangeDate}
            />
          )}
        </View>

        <View style={styles.toggleGroup}>
          <View style={styles.toggleHeader}><Text style={styles.label}>Valor Fixo / Recorrente?</Text><Switch value={isFixo} onValueChange={handleToggleFixo} trackColor={{ false: '#d1d5db', true: '#86efac' }} thumbColor={isFixo ? '#22c55e' : '#f3f4f6'}/></View>
          {isFixo && (
            <View style={styles.conditionalFormGroup}>
              <Text style={styles.label}>Projetar por quantos meses?</Text>
              <TextInput style={styles.input} placeholder="Ex: 12" keyboardType="numeric" value={mesesProjecao} onChangeText={setMesesProjecao} />
              <Text style={styles.helperText}>O valor integral irá repetir em cada mês seguinte.</Text>
            </View>
          )}
        </View>

        {tipo === 'DESPESA' && (
          <>
            <View style={styles.toggleGroup}>
              <View style={styles.toggleHeader}><Text style={styles.label}>Compra Parcelada?</Text><Switch value={isParcelado} onValueChange={handleToggleParcelado} trackColor={{ false: '#d1d5db', true: '#93c5fd' }} thumbColor={isParcelado ? '#3b82f6' : '#f3f4f6'} /></View>
              {isParcelado && (
                <View style={styles.conditionalFormGroup}>
                  <Text style={styles.label}>Quantidade de parcelas</Text><TextInput style={styles.input} placeholder="Ex: 12" keyboardType="numeric" value={qtdParcelas} onChangeText={setQtdParcelas} />
                </View>
              )}
            </View>
            
            {!isContaTerceiros && (
              <View style={styles.toggleGroup}>
                <View style={styles.toggleHeader}><Text style={styles.label}>Compra para outra pessoa?</Text><Switch value={isTerceiro} onValueChange={setIsTerceiro} trackColor={{ false: '#d1d5db', true: '#fbcfe8' }} thumbColor={isTerceiro ? '#ec4899' : '#f3f4f6'}/></View>
                {isTerceiro && (
                  <View style={styles.conditionalFormGroup}><Text style={styles.label}>Quem deve pagar?</Text><TextInput style={styles.input} placeholder="Nome da pessoa" value={nomeTerceiro} onChangeText={setNomeTerceiro} /></View>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.saveButton, isLoading && { opacity: 0.7 }]} onPress={handleSalvar} disabled={isLoading} activeOpacity={0.8}>{isLoading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.saveButtonText}>Guardar</Text>}</TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }, closeBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' }, headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' }, scrollContent: { padding: 20, paddingBottom: 40 }, typeSelector: { flexDirection: 'row', backgroundColor: '#f3f4f6', borderRadius: 12, padding: 4, marginBottom: 24 }, typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' }, typeBtnDespesa: { backgroundColor: '#ef4444', shadowColor: '#ef4444', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, elevation: 2 }, typeBtnReceita: { backgroundColor: '#10b981', shadowColor: '#10b981', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, elevation: 2 }, typeText: { fontSize: 14, fontWeight: '600', color: '#6b7280' }, typeTextActive: { color: '#ffffff' }, amountContainer: { alignItems: 'center', marginBottom: 32 }, currencySymbol: { fontSize: 20, color: '#9ca3af', marginBottom: 4 }, amountInput: { fontSize: 48, fontWeight: 'bold', color: '#1f2937', textAlign: 'center', minWidth: 200 }, formGroup: { marginBottom: 20 }, label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }, input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 16, fontSize: 16, color: '#1f2937' }, sectionContainer: { marginBottom: 24 }, chipScrollView: { flexDirection: 'row', marginTop: 8, marginHorizontal: -20, paddingHorizontal: 20 }, chip: { backgroundColor: '#f3f4f6', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, marginRight: 10,borderWidth: 1,borderColor: '#e5e7eb'}, chipSelected: { backgroundColor: '#eff6ff', borderColor: '#3b82f6' }, chipText: { fontSize: 14, color: '#6b7280', fontWeight: '500' }, chipTextSelected: { color: '#3b82f6', fontWeight: 'bold' }, toggleGroup: { marginBottom: 20, backgroundColor: '#f9fafb', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e5e7eb' }, toggleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, conditionalFormGroup: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb' }, helperText: { fontSize: 12, color: '#9ca3af', marginTop: 8, fontStyle: 'italic' }, footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#f3f4f6', backgroundColor: '#ffffff' }, saveButton: { backgroundColor: '#3b82f6', borderRadius: 16, paddingVertical: 18, alignItems: 'center' }, saveButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});