// app/add-transaction.tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAccounts } from '../hooks/useAccounts';
import { salvarTransacaoNoFirebase } from '../services/firebase/firestore';

// Definimos categorias diferentes para cada tipo
const TAGS_DESPESA = ['🛒 Supermercado', '🍔 Lazer', '🏠 Casa', '🚗 Transporte', '🏥 Saúde', '🛍️ Compras'];
const TAGS_RECEITA = ['💰 Salário', '💸 Pix', '🏦 Transferência', '📈 Rendimentos', '🎁 Outros'];

export default function AddTransactionModal() {
  const { contas } = useAccounts();
  
  // --- ESTADOS DO FORMULÁRIO ---
  const [tipo, setTipo] = useState<'DESPESA' | 'RECEITA'>('DESPESA');
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataPagamento, setDataPagamento] = useState(''); 
  
  const [contaSelecionada, setContaSelecionada] = useState('');
  const [tagSelecionada, setTagSelecionada] = useState(TAGS_DESPESA[0]);
  
  const [isParcelado, setIsParcelado] = useState(false);
  const [qtdParcelas, setQtdParcelas] = useState('2');
  const [isTerceiro, setIsTerceiro] = useState(false);
  const [nomeTerceiro, setNomeTerceiro] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);

  // Seleciona a primeira conta automaticamente ao carregar
  useEffect(() => {
    if (contas.length > 0 && contaSelecionada === '') {
      setContaSelecionada(contas[0].nome);
    }
  }, [contas]);

  // Muda as tags automaticamente quando troca entre Despesa/Receita
  const handleMudarTipo = (novoTipo: 'DESPESA' | 'RECEITA') => {
    setTipo(novoTipo);
    setTagSelecionada(novoTipo === 'DESPESA' ? TAGS_DESPESA[0] : TAGS_RECEITA[0]);
  };

  // --- MÁSCARAS ---
  const handleValorChange = (texto: string) => {
    const apenasNumeros = texto.replace(/\D/g, '');
    const valorDecimal = Number(apenasNumeros) / 100;
    
    if (apenasNumeros === '') {
      setValor('');
      return;
    }

    const valorFormatado = valorDecimal.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    setValor(valorFormatado);
  };

  const handleDataChange = (texto: string) => {
    let v = texto.replace(/\D/g, '');
    if (v.length > 2) v = v.replace(/^(\d{2})(\d)/, '$1/$2');
    if (v.length > 5) v = v.replace(/^(\d{2})\/(\d{2})(\d)/, '$1/$2/$3');
    setDataPagamento(v.substring(0, 10));
  };

  // --- FUNÇÃO SALVAR ---
  const handleSalvar = async () => {
    if (!valor || !descricao) {
      Alert.alert('Atenção', 'Preencha o valor e a descrição antes de salvar.');
      return;
    }

    // Se for despesa, exige que tenha uma conta selecionada
    if (tipo === 'DESPESA' && !contaSelecionada) {
      Alert.alert('Atenção', 'Selecione uma conta ou tabela para esta despesa.');
      return;
    }

    setIsLoading(true);

    const resultado = await salvarTransacaoNoFirebase({
      tipo,
      valorFormatado: valor,
      descricao,
      // Se for receita, salvamos em uma conta genérica invisível
      contaSelecionada: tipo === 'RECEITA' ? 'Carteira Geral' : contaSelecionada,
      tagSelecionada,
      isParcelado: tipo === 'DESPESA' ? isParcelado : false,
      qtdParcelas,
      isTerceiro: tipo === 'DESPESA' ? isTerceiro : false,
      nomeTerceiro,
      dataPagamento 
    });

    setIsLoading(false);

    if (resultado.sucesso) {
      router.back();
    } else {
      Alert.alert('Erro', 'Ocorreu um problema ao salvar. Tente novamente.');
    }
  };

  const categoriasAtuais = tipo === 'DESPESA' ? TAGS_DESPESA : TAGS_RECEITA;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} activeOpacity={0.7}>
          <Ionicons name="close" size={24} color="#6b7280" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nova Transação</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* SELETOR RECEITA / DESPESA */}
        <View style={styles.typeSelector}>
          <TouchableOpacity style={[styles.typeBtn, tipo === 'DESPESA' && styles.typeBtnDespesa]} onPress={() => handleMudarTipo('DESPESA')} activeOpacity={0.8}>
            <Text style={[styles.typeText, tipo === 'DESPESA' && styles.typeTextActive]}>Despesa</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.typeBtn, tipo === 'RECEITA' && styles.typeBtnReceita]} onPress={() => handleMudarTipo('RECEITA')} activeOpacity={0.8}>
            <Text style={[styles.typeText, tipo === 'RECEITA' && styles.typeTextActive]}>Receita</Text>
          </TouchableOpacity>
        </View>

        {/* INPUT DE VALOR */}
        <View style={styles.amountContainer}>
          <Text style={styles.currencySymbol}>R$</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0,00"
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
            value={valor}
            onChangeText={handleValorChange}
            maxLength={15}
          />
        </View>

        {/* SÓ MOSTRA O SELETOR DE CONTAS SE FOR DESPESA */}
        {tipo === 'DESPESA' && (
          <View style={styles.sectionContainer}>
            <Text style={styles.label}>Conta / Tabela</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScrollView}>
              {contas.length === 0 ? (
                <Text style={{ marginLeft: 20, color: '#9ca3af', fontStyle: 'italic' }}>Nenhuma tabela encontrada. Crie na aba "Contas".</Text>
              ) : (
                contas.map((conta) => (
                  <TouchableOpacity
                    key={conta.id}
                    style={[styles.chip, contaSelecionada === conta.nome && styles.chipSelected]}
                    onPress={() => setContaSelecionada(conta.nome)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, contaSelecionada === conta.nome && styles.chipTextSelected]}>{conta.nome}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        )}

        {/* SELETOR DE CATEGORIAS (DINÂMICO) */}
        <View style={styles.sectionContainer}>
          <Text style={styles.label}>Categoria</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScrollView}>
            {categoriasAtuais.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[styles.chip, tagSelecionada === tag && styles.chipSelected]}
                onPress={() => setTagSelecionada(tag)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, tagSelecionada === tag && styles.chipTextSelected]}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Descrição</Text>
          <TextInput
            style={styles.input}
            placeholder={tipo === 'DESPESA' ? "Ex: Supermercado, Internet..." : "Ex: Salário, Projeto X..."}
            value={descricao}
            onChangeText={setDescricao}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Data do Recebimento / Pagamento</Text>
          <TextInput
            style={styles.input}
            placeholder="DD/MM/AAAA (Deixe em branco para hoje)"
            keyboardType="numeric"
            maxLength={10}
            value={dataPagamento}
            onChangeText={handleDataChange}
          />
        </View>

        {/* REGRAS EXTRAS SÓ PARA DESPESAS */}
        {tipo === 'DESPESA' && (
          <>
            <View style={styles.toggleGroup}>
              <View style={styles.toggleHeader}>
                <Text style={styles.label}>Compra Parcelada?</Text>
                <Switch 
                  value={isParcelado} 
                  onValueChange={setIsParcelado} 
                  trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                  thumbColor={isParcelado ? '#3b82f6' : '#f3f4f6'}
                />
              </View>
              {isParcelado && (
                <View style={styles.conditionalFormGroup}>
                  <Text style={styles.label}>Quantidade de parcelas</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 12"
                    keyboardType="numeric"
                    value={qtdParcelas}
                    onChangeText={setQtdParcelas}
                  />
                </View>
              )}
            </View>

            <View style={styles.toggleGroup}>
              <View style={styles.toggleHeader}>
                <Text style={styles.label}>Compra para outra pessoa?</Text>
                <Switch 
                  value={isTerceiro} 
                  onValueChange={setIsTerceiro}
                  trackColor={{ false: '#d1d5db', true: '#fbcfe8' }}
                  thumbColor={isTerceiro ? '#ec4899' : '#f3f4f6'}
                />
              </View>
              {isTerceiro && (
                <View style={styles.conditionalFormGroup}>
                  <Text style={styles.label}>Quem deve pagar?</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Nome da pessoa"
                    value={nomeTerceiro}
                    onChangeText={setNomeTerceiro}
                  />
                  <Text style={styles.helperText}>A regra da tabela será ignorada, 100% irá para a aba "A Receber".</Text>
                </View>
              )}
            </View>
          </>
        )}

      </ScrollView>

      {/* BOTÃO SALVAR */}
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.saveButton, isLoading && { opacity: 0.7 }]} onPress={handleSalvar} disabled={isLoading} activeOpacity={0.8}>
          {isLoading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.saveButtonText}>Salvar</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  closeBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  typeSelector: { flexDirection: 'row', backgroundColor: '#f3f4f6', borderRadius: 12, padding: 4, marginBottom: 24 },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  typeBtnDespesa: { backgroundColor: '#ef4444', shadowColor: '#ef4444', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, elevation: 2 },
  typeBtnReceita: { backgroundColor: '#10b981', shadowColor: '#10b981', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, elevation: 2 },
  typeText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  typeTextActive: { color: '#ffffff' },

  amountContainer: { alignItems: 'center', marginBottom: 32 },
  currencySymbol: { fontSize: 20, color: '#9ca3af', marginBottom: 4 },
  amountInput: { fontSize: 48, fontWeight: 'bold', color: '#1f2937', textAlign: 'center', minWidth: 200 },

  formGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 16, fontSize: 16, color: '#1f2937' },

  sectionContainer: { marginBottom: 24 },
  chipScrollView: { flexDirection: 'row', marginTop: 8, marginHorizontal: -20, paddingHorizontal: 20 },
  chip: { backgroundColor: '#f3f4f6', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, marginRight: 10,borderWidth: 1,borderColor: '#e5e7eb'},
  chipSelected: { backgroundColor: '#eff6ff', borderColor: '#3b82f6' },
  chipText: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  chipTextSelected: { color: '#3b82f6', fontWeight: 'bold' },
  
  toggleGroup: { marginBottom: 20, backgroundColor: '#f9fafb', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  toggleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  conditionalFormGroup: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  helperText: { fontSize: 12, color: '#ec4899', marginTop: 8, fontStyle: 'italic' },

  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#f3f4f6', backgroundColor: '#ffffff' },
  saveButton: { backgroundColor: '#3b82f6', borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  saveButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});