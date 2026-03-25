// app/(tabs)/profile.tsx
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTransactions } from '../../hooks/useTransactions';
import { auth } from '../../services/firebase/config';

import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function ProfileScreen() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Estados do Modal e Filtros
  const [modalVisible, setModalVisible] = useState(false);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [tipoExportacao, setTipoExportacao] = useState<'PDF' | 'CSV'>('PDF');

  const { transacoes } = useTransactions();

  const user = auth.currentUser;
  const emailLogado = user?.email || 'Usuário Desconhecido';
  const inicial = emailLogado.charAt(0).toUpperCase();
  const nomeExibicao = emailLogado.split('@')[0];

  const handleLogout = () => {
    Alert.alert('Sair da Conta', 'Tem certeza que deseja sair do aplicativo?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: async () => await signOut(auth) }
    ]);
  };

  const handleDataChange = (texto: string, setter: any) => {
    let v = texto.replace(/\D/g, '');
    if (v.length > 2) v = v.replace(/^(\d{2})(\d)/, '$1/$2');
    if (v.length > 5) v = v.replace(/^(\d{2})\/(\d{2})(\d)/, '$1/$2/$3');
    setter(v.substring(0, 10));
  };

  const formatarMoeda = (valor: number) => `R$ ${valor.toFixed(2).replace('.', ',')}`;
  const formatarData = (dataIso: string) => new Date(dataIso).toLocaleDateString('pt-BR');

  // --- MÓDULO DE EXPORTAÇÃO (Organizado por Tabelas) ---

  const agruparPorConta = (lista: any[]) => {
    const grupos: Record<string, any[]> = {};
    lista.forEach(t => {
      if (!grupos[t.accountId]) grupos[t.accountId] = [];
      grupos[t.accountId].push(t);
    });
    return grupos;
  };

  const gerarPDF = async (lista: any[]) => {
    setIsExporting(true);
    try {
      const transacoesAgrupadas = agruparPorConta(lista);
      let htmlTabelas = '';

      for (const [nomeTabela, transacoesDaTabela] of Object.entries(transacoesAgrupadas)) {
        let totalReceitas = 0;
        let totalDespesas = 0;

        const transacoesOrdenadas = [...transacoesDaTabela].sort((a, b) => b.type.localeCompare(a.type));

        const linhasHTML = transacoesOrdenadas.map(t => {
          if (t.type === 'RECEITA') totalReceitas += t.amount;
          else totalDespesas += t.amount;

          return `
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formatarData(t.paymentDate || t.date)}</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${t.descricao}</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold; color: ${t.type === 'RECEITA' ? '#10b981' : '#ef4444'};">
                ${t.type === 'RECEITA' ? '+' : '-'}${formatarMoeda(t.amount)}
              </td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${t.isPaid ? 'Pago' : 'Pendente'}</td>
            </tr>
          `;
        }).join('');

        const saldoFinalTabela = totalReceitas - totalDespesas;

        htmlTabelas += `
          <div style="margin-bottom: 40px;">
            <h2 style="color: #1f2937; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 2px solid #3b82f6;">
              📘 Tabela: ${nomeTabela}
            </h2>
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Valor</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${linhasHTML}
              </tbody>
            </table>
            <div style="text-align: right; margin-top: 15px; font-size: 14px; background-color: #f9fafb; padding: 10px; border-radius: 8px;">
              <span>Entradas: <b style="color: #10b981;">${formatarMoeda(totalReceitas)}</b></span> &nbsp; | &nbsp;
              <span>Saídas: <b style="color: #ef4444;">${formatarMoeda(totalDespesas)}</b></span> &nbsp; | &nbsp;
              <span style="font-size: 16px;">Saldo da Tabela: <b style="color: ${saldoFinalTabela >= 0 ? '#10b981' : '#ef4444'};">${formatarMoeda(saldoFinalTabela)}</b></span>
            </div>
          </div>
        `;
      }

      let periodoTexto = 'Todo o Histórico';
      if (dataInicio && dataFim) periodoTexto = `De ${dataInicio} até ${dataFim}`;
      else if (dataInicio) periodoTexto = `A partir de ${dataInicio}`;
      else if (dataFim) periodoTexto = `Até ${dataFim}`;

      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 30px; color: #374151; }
              h1 { color: #1e3a8a; text-align: center; font-size: 28px; margin-bottom: 5px; }
              .header-info { text-align: center; color: #6b7280; font-size: 14px; margin-bottom: 40px; }
              table { width: 100%; border-collapse: collapse; font-size: 13px; }
              th { background-color: #f3f4f6; padding: 10px 8px; text-align: left; color: #4b5563; }
            </style>
          </head>
          <body>
            <h1>Relatório de Contas</h1>
            <div class="header-info">
              Exportado por: <b>${nomeExibicao}</b> &nbsp;|&nbsp; Período: <b>${periodoTexto}</b> <br/>
              Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
            </div>
            ${htmlTabelas || '<p style="text-align: center; color: #9ca3af; margin-top: 50px;">Nenhuma transação encontrada no período.</p>'}
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });

    } catch (error) {
      Alert.alert('Erro', 'Não foi possível gerar o PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  const gerarCSV = async (lista: any[]) => {
    setIsExporting(true);
    try {
      let csvString = "Tabela/Conta,Tipo,Data,Descricao,Categoria,Valor,Status\n";

      const listaOrdenada = [...lista].sort((a, b) => {
        if (a.accountId !== b.accountId) return a.accountId.localeCompare(b.accountId);
        if (a.type !== b.type) return b.type.localeCompare(a.type);
        return new Date(b.paymentDate || b.date).getTime() - new Date(a.paymentDate || a.date).getTime();
      });

      listaOrdenada.forEach(t => {
        const conta = t.accountId;
        const tipo = t.type;
        const data = formatarData(t.paymentDate || t.date);
        const desc = t.descricao.replace(/,/g, ' '); 
        const categoria = t.tags ? t.tags[0] : '';
        const valor = t.amount.toFixed(2);
        const status = t.isPaid ? 'Pago' : 'Pendente';
        
        csvString += `${conta},${tipo},${data},${desc},${categoria},${valor},${status}\n`;
      });

      const nomeArquivo = `relatorio_${Date.now()}.csv`;
      const file = new FileSystem.File(FileSystem.Paths.cache, nomeArquivo);

      file.write(csvString, { encoding: 'utf8' });
      await Sharing.shareAsync(file.uri, { dialogTitle: 'Exportar Planilha' });

    } catch (error: any) {
      Alert.alert('Erro ao exportar', error.message || 'Falha desconhecida pelo sistema.');
    } finally {
      setIsExporting(false);
    }
  };

  // --- LÓGICA DE FILTRAGEM ---

  const filtrarTransacoes = () => {
    if (!dataInicio && !dataFim) return transacoes;

    return transacoes.filter(t => {
      const dataTransacao = new Date(t.paymentDate || t.date);
      let inicioValido = true;
      let fimValido = true;

      if (dataInicio && dataInicio.length === 10) {
        const [diaI, mesI, anoI] = dataInicio.split('/');
        const dataI = new Date(Number(anoI), Number(mesI) - 1, Number(diaI));
        inicioValido = dataTransacao >= dataI;
      }

      if (dataFim && dataFim.length === 10) {
        const [diaF, mesF, anoF] = dataFim.split('/');
        const dataF = new Date(Number(anoF), Number(mesF) - 1, Number(diaF), 23, 59, 59);
        fimValido = dataTransacao <= dataF;
      }

      return inicioValido && fimValido;
    });
  };

  const handleMenuExportar = () => {
    if (transacoes.length === 0) return Alert.alert('Aviso', 'Você não possui transações para exportar ainda.');
    setModalVisible(true);
  };

  const executarExportacao = () => {
    setModalVisible(false);
    const transacoesFiltradas = filtrarTransacoes();
    
    if (transacoesFiltradas.length === 0) {
      return Alert.alert('Aviso', 'Nenhuma transação encontrada neste período.');
    }

    if (tipoExportacao === 'PDF') gerarPDF(transacoesFiltradas); 
    else gerarCSV(transacoesFiltradas);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meu Perfil</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{inicial}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{nomeExibicao}</Text>
            <Text style={styles.userEmail}>{emailLogado}</Text>
          </View>
          <TouchableOpacity style={styles.editBtn} activeOpacity={0.7}>
            <Ionicons name="pencil" size={18} color="#3b82f6" />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Preferências</Text>
        <View style={styles.menuGroup}>
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: '#f3f4f6' }]}>
                <Ionicons name="moon" size={20} color="#4b5563" />
              </View>
              <Text style={styles.menuItemText}>Modo Escuro</Text>
            </View>
            <Switch value={isDarkMode} onValueChange={setIsDarkMode} trackColor={{ false: '#d1d5db', true: '#93c5fd' }} thumbColor={isDarkMode ? '#3b82f6' : '#f3f4f6'} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Dados e Compartilhamento</Text>
        <View style={styles.menuGroup}>
          <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: '#eff6ff' }]}>
                <Ionicons name="people" size={20} color="#3b82f6" />
              </View>
              <Text style={styles.menuItemText}>Regra de Divisão Padrão</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem} onPress={handleMenuExportar} activeOpacity={0.7} disabled={isExporting}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: '#ecfdf5' }]}>
                {isExporting ? <ActivityIndicator color="#10b981" /> : <Ionicons name="download" size={20} color="#10b981" />}
              </View>
              <Text style={styles.menuItemText}>Exportar Relatório</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Segurança</Text>
        <View style={styles.menuGroup}>
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout} activeOpacity={0.7}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: '#fef2f2' }]}>
                <Ionicons name="log-out" size={20} color="#ef4444" />
              </View>
              <Text style={[styles.menuItemText, { color: '#ef4444', fontWeight: 'bold' }]}>Sair da Conta</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.appVersion}>Versão 1.0.0 • 2026</Text>

      </ScrollView>

      {/* MODAL DE EXPORTAÇÃO */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Configurar Relatório</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Formato</Text>
              <View style={styles.row}>
                <TouchableOpacity style={[styles.chip, tipoExportacao === 'PDF' && styles.chipActive]} onPress={() => setTipoExportacao('PDF')}><Text style={[styles.chipText, tipoExportacao === 'PDF' && styles.chipTextActive]}>📄 PDF</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.chip, tipoExportacao === 'CSV' && styles.chipActive]} onPress={() => setTipoExportacao('CSV')}><Text style={[styles.chipText, tipoExportacao === 'CSV' && styles.chipTextActive]}>📊 Planilha</Text></TouchableOpacity>
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Data Inicial</Text>
                <TextInput style={styles.input} placeholder="DD/MM/AAAA" keyboardType="numeric" maxLength={10} value={dataInicio} onChangeText={(t) => handleDataChange(t, setDataInicio)} />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Data Final</Text>
                <TextInput style={styles.input} placeholder="DD/MM/AAAA" keyboardType="numeric" maxLength={10} value={dataFim} onChangeText={(t) => handleDataChange(t, setDataFim)} />
              </View>
            </View>
            <Text style={styles.helperText}>Deixe em branco para exportar todo o histórico.</Text>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}><Text style={styles.cancelBtnText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={executarExportacao}><Text style={styles.confirmBtnText}>Gerar Relatório</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' }, header: { padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 50, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }, headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' }, scrollContent: { padding: 20, paddingBottom: 100 }, userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 20, borderRadius: 16, marginBottom: 24, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 }, avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', marginRight: 16 }, avatarText: { fontSize: 24, fontWeight: 'bold', color: '#ffffff' }, userInfo: { flex: 1 }, userName: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 4, textTransform: 'capitalize' }, userEmail: { fontSize: 14, color: '#6b7280' }, editBtn: { padding: 8, backgroundColor: '#eff6ff', borderRadius: 12 }, sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#6b7280', marginBottom: 12, marginLeft: 4, textTransform: 'uppercase' }, menuGroup: { backgroundColor: '#ffffff', borderRadius: 16, overflow: 'hidden', marginBottom: 24, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 }, menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }, menuItemLeft: { flexDirection: 'row', alignItems: 'center' }, menuIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 }, menuItemText: { fontSize: 16, fontWeight: '500', color: '#1f2937' }, divider: { height: 1, backgroundColor: '#f3f4f6', marginLeft: 68 }, appVersion: { textAlign: 'center', color: '#9ca3af', fontSize: 12, marginTop: 10 },
  
  // Estilos do Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }, 
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }, 
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 20 }, 
  row: { flexDirection: 'row', gap: 12 }, 
  chip: { flex: 1, backgroundColor: '#f3f4f6', paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' }, 
  chipActive: { backgroundColor: '#eff6ff', borderColor: '#3b82f6' }, 
  chipText: { fontSize: 14, color: '#6b7280', fontWeight: '500' }, 
  chipTextActive: { color: '#3b82f6', fontWeight: 'bold' }, 
  formGroup: { marginBottom: 20 }, 
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }, 
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 16, fontSize: 16, color: '#1f2937' }, 
  helperText: { fontSize: 12, color: '#9ca3af', marginTop: -10, marginBottom: 20, fontStyle: 'italic' }, 
  modalFooter: { flexDirection: 'row', gap: 12 }, 
  cancelBtn: { flex: 1, backgroundColor: '#f3f4f6', paddingVertical: 16, borderRadius: 12, alignItems: 'center' }, 
  cancelBtnText: { color: '#4b5563', fontSize: 16, fontWeight: 'bold' }, 
  confirmBtn: { flex: 1, backgroundColor: '#3b82f6', paddingVertical: 16, borderRadius: 12, alignItems: 'center' }, 
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});