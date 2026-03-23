// app/add-transaction.tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function AddTransactionModal() {
    // Função para formatar o dinheiro em tempo real
  const handleValorChange = (texto: string) => {
    // 1. Remove tudo o que não for número
    const apenasNumeros = texto.replace(/\D/g, '');
    
    // 2. Transforma em número decimal (divide por 100)
    const valorDecimal = Number(apenasNumeros) / 100;
    
    // 3. Formata para o padrão BRL (Ex: 1.500,00)
    // Usamos string pura para evitar bugs no teclado do telemóvel
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
  // Estados do nosso formulário
  const [tipo, setTipo] = useState<'DESPESA' | 'RECEITA'>('DESPESA');
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  
  // Regras de negócio
  const [isParcelado, setIsParcelado] = useState(false);
  const [qtdParcelas, setQtdParcelas] = useState('2');
  
  const [isTerceiro, setIsTerceiro] = useState(false);
  const [nomeTerceiro, setNomeTerceiro] = useState('');

  // Novos estados para seleção
  const [contaSelecionada, setContaSelecionada] = useState('Nubank Comum');
  const [tagSelecionada, setTagSelecionada] = useState('Supermercado');

  // Listas de opções (Mocks baseados na sua estrutura)
  const contasCasa = ['Nubank Comum', 'Santander Comum', 'Recorrentes Casa'];
  const contasIndividuais = ['Nubank Indiv.', 'Santander Indiv.'];
  
  // Vamos juntar as contas para exibir, mas você pode separar depois se quiser
  const todasContas = [...contasCasa, ...contasIndividuais];
  
  const tagsPadrao = ['🛒 Supermercado', '🍔 Lazer', '🏠 Casa', '🚗 Transporte', '🏥 Saúde', '🛍️ Compras'];

  const handleSalvar = () => {
    // Aqui no futuro chamaremos a função para salvar no Firebase!
    console.log('Salvando:', { tipo, valor, descricao, isParcelado, qtdParcelas, isTerceiro, nomeTerceiro });
    router.back(); // Fecha o modal
  };

  return (
    <View style={styles.container}>
      {/* CABEÇALHO DO MODAL */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color="#6b7280" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nova Transação</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* SELETOR RECEITA / DESPESA */}
        <View style={styles.typeSelector}>
          <TouchableOpacity 
            style={[styles.typeBtn, tipo === 'DESPESA' && styles.typeBtnDespesa]} 
            onPress={() => setTipo('DESPESA')}
          >
            <Text style={[styles.typeText, tipo === 'DESPESA' && styles.typeTextActive]}>Despesa</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.typeBtn, tipo === 'RECEITA' && styles.typeBtnReceita]} 
            onPress={() => setTipo('RECEITA')}
          >
            <Text style={[styles.typeText, tipo === 'RECEITA' && styles.typeTextActive]}>Receita</Text>
          </TouchableOpacity>
        </View>

        {/* INPUT DE VALOR (Destacado) */}
        <View style={styles.amountContainer}>
          <Text style={styles.currencySymbol}>R$</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0,00"
            placeholderTextColor="#9ca3af"
            keyboardType="numeric" // Garante que só abre o teclado de números
            value={valor}
            onChangeText={handleValorChange} // 👈 Aqui entra a nossa máscara
            maxLength={15} // Evita que o número fique gigante e quebre o layout
          />
        </View>

        {/* SELETOR DE CONTAS / CARTÕES */}
        <View style={styles.sectionContainer}>
          <Text style={styles.label}>Conta / Cartão</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScrollView}>
            {todasContas.map((conta) => (
              <TouchableOpacity
                key={conta}
                style={[styles.chip, contaSelecionada === conta && styles.chipSelected]}
                onPress={() => setContaSelecionada(conta)}
              >
                <Text style={[styles.chipText, contaSelecionada === conta && styles.chipTextSelected]}>
                  {conta}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* SELETOR DE TAGS / CATEGORIAS */}
        <View style={styles.sectionContainer}>
          <Text style={styles.label}>Categoria</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScrollView}>
            {tagsPadrao.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[styles.chip, tagSelecionada === tag && styles.chipSelected]}
                onPress={() => setTagSelecionada(tag)}
              >
                <Text style={[styles.chipText, tagSelecionada === tag && styles.chipTextSelected]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* CAMPOS BÁSICOS */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Descrição</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Supermercado, Internet..."
            value={descricao}
            onChangeText={setDescricao}
          />
        </View>

        {/* SE SÓ FOR DESPESA, MOSTRA OPÇÕES DE CARTÃO E TERCEIROS */}
        {tipo === 'DESPESA' && (
          <>
            {/* LÓGICA DE PARCELAMENTO */}
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

            {/* LÓGICA DE TERCEIROS */}
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
                  <Text style={styles.helperText}>A regra 67/33 será anulada para esta compra.</Text>
                </View>
              )}
            </View>
          </>
        )}

      </ScrollView>

      {/* BOTÃO SALVAR */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSalvar}>
          <Text style={styles.saveButtonText}>Salvar Transação</Text>
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