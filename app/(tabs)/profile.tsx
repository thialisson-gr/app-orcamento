// app/(tabs)/profile.tsx
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme'; // 👈 TEMA IMPORTADO
import { useTransactions } from '../../hooks/useTransactions';
import { auth } from '../../services/firebase/config';
import { buscarRegraPadrao, salvarRegraPadrao } from '../../services/firebase/firestore';

import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function ProfileScreen() {
  const { isDarkMode, toggleTheme, colors } = useTheme(); // 👈 LENDO AS CORES DO TEMA
  const [isExporting, setIsExporting] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [tipoExportacao, setTipoExportacao] = useState<'PDF' | 'CSV'>('PDF');

  const [modalRegraVisible, setModalRegraVisible] = useState(false);
  const [regraEu, setRegraEu] = useState(50);
  const regraRay = 100 - regraEu;

  const { transacoes } = useTransactions();

  const user = auth.currentUser;
  const emailLogado = user?.email || 'Usuário Desconhecido';
  const inicial = emailLogado.charAt(0).toUpperCase();
  const nomeExibicao = emailLogado.split('@')[0];

  useEffect(() => {
    buscarRegraPadrao().then(regra => setRegraEu(regra.me));
  }, []);

  const handleSalvarRegra = async () => {
    await salvarRegraPadrao(regraEu, regraRay);
    setModalRegraVisible(false);
    Alert.alert('Sucesso', 'Regra padrão atualizada!');
  };

  const handleLogout = () => {
    Alert.alert('Sair da Conta', 'Tem certeza que deseja sair?', [
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
        let totalReceitas = 0; let totalDespesas = 0;
        const transacoesOrdenadas = [...transacoesDaTabela].sort((a, b) => b.type.localeCompare(a.type));

        const linhasHTML = transacoesOrdenadas.map(t => {
          if (t.type === 'RECEITA') totalReceitas += t.amount; else totalDespesas += t.amount;
          return `<tr><td style="padding: 8px; border-bottom: 1px solid #ddd;">${formatarData(t.paymentDate || t.date)}</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${t.descricao}</td><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold; color: ${t.type === 'RECEITA' ? '#10b981' : '#ef4444'};">${t.type === 'RECEITA' ? '+' : '-'}${formatarMoeda(t.amount)}</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${t.isPaid ? 'Pago' : 'Pendente'}</td></tr>`;
        }).join('');

        const saldoFinalTabela = totalReceitas - totalDespesas;
        htmlTabelas += `<div style="margin-bottom: 40px;"><h2 style="color: #1f2937; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 2px solid #3b82f6;">📘 Tabela: ${nomeTabela}</h2><table><thead><tr><th>Data</th><th>Descrição</th><th>Valor</th><th>Status</th></tr></thead><tbody>${linhasHTML}</tbody></table><div style="text-align: right; margin-top: 15px; font-size: 14px; background-color: #f9fafb; padding: 10px; border-radius: 8px;"><span>Entradas: <b style="color: #10b981;">${formatarMoeda(totalReceitas)}</b></span> &nbsp; | &nbsp;<span>Saídas: <b style="color: #ef4444;">${formatarMoeda(totalDespesas)}</b></span> &nbsp; | &nbsp;<span style="font-size: 16px;">Saldo da Tabela: <b style="color: ${saldoFinalTabela >= 0 ? '#10b981' : '#ef4444'};">${formatarMoeda(saldoFinalTabela)}</b></span></div></div>`;
      }

      let periodoTexto = 'Todo o Histórico';
      if (dataInicio && dataFim) periodoTexto = `De ${dataInicio} até ${dataFim}`;
      else if (dataInicio) periodoTexto = `A partir de ${dataInicio}`;
      else if (dataFim) periodoTexto = `Até ${dataFim}`;

      const htmlContent = `<html><head><style>body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 30px; color: #374151; } h1 { color: #1e3a8a; text-align: center; font-size: 28px; margin-bottom: 5px; } .header-info { text-align: center; color: #6b7280; font-size: 14px; margin-bottom: 40px; } table { width: 100%; border-collapse: collapse; font-size: 13px; } th { background-color: #f3f4f6; padding: 10px 8px; text-align: left; color: #4b5563; }</style></head><body><h1>Relatório de Contas</h1><div class="header-info">Exportado por: <b>${nomeExibicao}</b> &nbsp;|&nbsp; Período: <b>${periodoTexto}</b> <br/>Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</div>${htmlTabelas || '<p style="text-align: center; color: #9ca3af; margin-top: 50px;">Nenhuma transação encontrada no período.</p>'}</body></html>`;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) { Alert.alert('Erro', 'Não foi possível gerar o PDF.'); } finally { setIsExporting(false); }
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

      listaOrdenada.forEach(t => { csvString += `${t.accountId},${t.type},${formatarData(t.paymentDate || t.date)},${t.descricao.replace(/,/g, ' ')},${t.tags ? t.tags[0] : ''},${t.amount.toFixed(2)},${t.isPaid ? 'Pago' : 'Pendente'}\n`; });

      const nomeArquivo = `relatorio_${Date.now()}.csv`;
      const file = new FileSystem.File(FileSystem.Paths.cache, nomeArquivo);
      file.write(csvString, { encoding: 'utf8' });
      await Sharing.shareAsync(file.uri, { dialogTitle: 'Exportar Planilha' });
    } catch (error: any) { Alert.alert('Erro', error.message || 'Falha.'); } finally { setIsExporting(false); }
  };

  const filtrarTransacoes = () => {
    if (!dataInicio && !dataFim) return transacoes;
    return transacoes.filter(t => {
      const d = new Date(t.paymentDate || t.date);
      let inc = true; let fmc = true;
      if (dataInicio && dataInicio.length === 10) { const [dia, mes, ano] = dataInicio.split('/'); inc = d >= new Date(Number(ano), Number(mes) - 1, Number(dia)); }
      if (dataFim && dataFim.length === 10) { const [dia, mes, ano] = dataFim.split('/'); fmc = d <= new Date(Number(ano), Number(mes) - 1, Number(dia), 23, 59, 59); }
      return inc && fmc;
    });
  };

  const executarExportacao = () => {
    setModalVisible(false);
    const filtradas = filtrarTransacoes();
    if (filtradas.length === 0) return Alert.alert('Aviso', 'Vazio neste período.');
    if (tipoExportacao === 'PDF') gerarPDF(filtradas); else gerarCSV(filtradas);
  };

  return (
    // 👇 Aplicando cor de fundo
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: isDarkMode ? '#374151' : '#e5e7eb' }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Meu Perfil</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.userCard, { backgroundColor: colors.card }]}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{inicial}</Text></View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>{nomeExibicao}</Text>
            <Text style={[styles.userEmail, { color: colors.subText }]}>{emailLogado}</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.subText }]}>Preferências</Text>
        <View style={[styles.menuGroup, { backgroundColor: colors.card }]}>
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: isDarkMode ? '#374151' : '#f3f4f6' }]}><Ionicons name="moon" size={20} color={colors.subText} /></View>
              <Text style={[styles.menuItemText, { color: colors.text }]}>Modo Escuro</Text>
            </View>
            <Switch value={isDarkMode} onValueChange={toggleTheme} trackColor={{ false: '#d1d5db', true: '#93c5fd' }} thumbColor={isDarkMode ? '#3b82f6' : '#f3f4f6'} />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.subText }]}>Dados e Compartilhamento</Text>
        <View style={[styles.menuGroup, { backgroundColor: colors.card }]}>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => setModalRegraVisible(true)} activeOpacity={0.7}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: isDarkMode ? '#1e3a8a' : '#eff6ff' }]}><Ionicons name="people" size={20} color={colors.accent} /></View>
              <Text style={[styles.menuItemText, { color: colors.text }]}>Regra de Divisão Padrão</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#4b5563' : '#d1d5db'} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: isDarkMode ? '#374151' : '#f3f4f6' }]} />

          <TouchableOpacity style={styles.menuItem} onPress={() => { if (transacoes.length === 0) return Alert.alert('Aviso', 'Sem dados.'); setModalVisible(true); }} activeOpacity={0.7} disabled={isExporting}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: isDarkMode ? '#064e3b' : '#ecfdf5' }]}>{isExporting ? <ActivityIndicator color="#10b981" /> : <Ionicons name="download" size={20} color="#10b981" />}</View>
              <Text style={[styles.menuItemText, { color: colors.text }]}>Exportar Relatório</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#4b5563' : '#d1d5db'} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.subText }]}>Segurança</Text>
        <View style={[styles.menuGroup, { backgroundColor: colors.card }]}>
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout} activeOpacity={0.7}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: isDarkMode ? '#7f1d1d' : '#fef2f2' }]}><Ionicons name="log-out" size={20} color="#ef4444" /></View>
              <Text style={[styles.menuItemText, { color: '#ef4444', fontWeight: 'bold' }]}>Sair da Conta</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={[styles.appVersion, { color: colors.subText }]}>Versão 1.0.0 • 2026</Text>
      </ScrollView>

      {/* --- MODAL DA REGRA --- */}
      <Modal animationType="slide" transparent={true} visible={modalRegraVisible} onRequestClose={() => setModalRegraVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Regra de Divisão Padrão</Text>
            <Text style={[styles.helperText, { color: colors.subText }]}>Ajuste a porcentagem padrão.</Text>

            <View style={{ backgroundColor: isDarkMode ? '#111827' : '#f9fafb', padding: 20, borderRadius: 16, marginBottom: 24, borderWidth: isDarkMode ? 1 : 0, borderColor: '#374151' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>Sua Parte</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: isDarkMode ? '#4b5563' : '#e5e7eb' }}>
                  <TouchableOpacity onPress={() => regraEu > 0 && setRegraEu(regraEu - 1)} style={{ padding: 10 }}><Ionicons name="remove" size={20} color={colors.accent}/></TouchableOpacity>
                  <Text style={{ width: 40, textAlign: 'center', fontSize: 16, fontWeight: 'bold', color: colors.text }}>{regraEu}%</Text>
                  <TouchableOpacity onPress={() => regraEu < 100 && setRegraEu(regraEu + 1)} style={{ padding: 10 }}><Ionicons name="add" size={20} color={colors.accent}/></TouchableOpacity>
                </View>
              </View>
              <View style={{ height: 1, backgroundColor: isDarkMode ? '#374151' : '#e5e7eb', marginBottom: 16 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>Parte da Esposa</Text>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.subText, marginRight: 16 }}>{regraRay}%</Text>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: isDarkMode ? '#374151' : '#f3f4f6' }]} onPress={() => setModalRegraVisible(false)}><Text style={[styles.cancelBtnText, { color: isDarkMode ? '#d1d5db' : '#4b5563' }]}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: colors.accent }]} onPress={handleSalvarRegra}><Text style={styles.confirmBtnText}>Salvar Padrão</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- MODAL EXPORTAR --- */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Configurar Relatório</Text>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Formato</Text>
              <View style={styles.row}>
                <TouchableOpacity style={[styles.chip, { backgroundColor: isDarkMode ? '#374151' : '#f3f4f6', borderColor: isDarkMode ? '#4b5563' : '#e5e7eb' }, tipoExportacao === 'PDF' && { backgroundColor: isDarkMode ? '#1e3a8a' : '#eff6ff', borderColor: colors.accent }]} onPress={() => setTipoExportacao('PDF')}><Text style={[styles.chipText, { color: isDarkMode ? '#9ca3af' : '#6b7280' }, tipoExportacao === 'PDF' && { color: colors.accent, fontWeight: 'bold' }]}>📄 PDF</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.chip, { backgroundColor: isDarkMode ? '#374151' : '#f3f4f6', borderColor: isDarkMode ? '#4b5563' : '#e5e7eb' }, tipoExportacao === 'CSV' && { backgroundColor: isDarkMode ? '#1e3a8a' : '#eff6ff', borderColor: colors.accent }]} onPress={() => setTipoExportacao('CSV')}><Text style={[styles.chipText, { color: isDarkMode ? '#9ca3af' : '#6b7280' }, tipoExportacao === 'CSV' && { color: colors.accent, fontWeight: 'bold' }]}>📊 Planilha</Text></TouchableOpacity>
              </View>
            </View>
            <View style={styles.row}>
              <View style={[styles.formGroup, { flex: 1 }]}><Text style={[styles.label, { color: colors.text }]}>Data Inicial</Text><TextInput style={[styles.input, { backgroundColor: isDarkMode ? '#111827' : '#f9fafb', borderColor: isDarkMode ? '#4b5563' : '#e5e7eb', color: colors.text }]} placeholder="DD/MM/AAAA" placeholderTextColor={colors.subText} keyboardType="numeric" maxLength={10} value={dataInicio} onChangeText={(t) => handleDataChange(t, setDataInicio)} /></View>
              <View style={[styles.formGroup, { flex: 1 }]}><Text style={[styles.label, { color: colors.text }]}>Data Final</Text><TextInput style={[styles.input, { backgroundColor: isDarkMode ? '#111827' : '#f9fafb', borderColor: isDarkMode ? '#4b5563' : '#e5e7eb', color: colors.text }]} placeholder="DD/MM/AAAA" placeholderTextColor={colors.subText} keyboardType="numeric" maxLength={10} value={dataFim} onChangeText={(t) => handleDataChange(t, setDataFim)} /></View>
            </View>
            <Text style={[styles.helperText, { color: colors.subText }]}>Deixe em branco para exportar tudo.</Text>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: isDarkMode ? '#374151' : '#f3f4f6' }]} onPress={() => setModalVisible(false)}><Text style={[styles.cancelBtnText, { color: isDarkMode ? '#d1d5db' : '#4b5563' }]}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: colors.accent }]} onPress={executarExportacao}><Text style={styles.confirmBtnText}>Gerar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, header: { padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 50, borderBottomWidth: 1 }, headerTitle: { fontSize: 24, fontWeight: 'bold' }, scrollContent: { padding: 20, paddingBottom: 100 }, userCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 16, marginBottom: 24, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 }, avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', marginRight: 16 }, avatarText: { fontSize: 24, fontWeight: 'bold', color: '#ffffff' }, userInfo: { flex: 1 }, userName: { fontSize: 20, fontWeight: 'bold', marginBottom: 4, textTransform: 'capitalize' }, userEmail: { fontSize: 14 }, sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 12, marginLeft: 4, textTransform: 'uppercase' }, menuGroup: { borderRadius: 16, overflow: 'hidden', marginBottom: 24, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 }, menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }, menuItemLeft: { flexDirection: 'row', alignItems: 'center' }, menuIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 }, menuItemText: { fontSize: 16, fontWeight: '500' }, divider: { height: 1, marginLeft: 68 }, appVersion: { textAlign: 'center', fontSize: 12, marginTop: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }, modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }, modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 }, row: { flexDirection: 'row', gap: 12 }, chip: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1 }, chipText: { fontSize: 14, fontWeight: '500' }, formGroup: { marginBottom: 20 }, label: { fontSize: 14, fontWeight: '600', marginBottom: 8 }, input: { borderWidth: 1, borderRadius: 12, padding: 16, fontSize: 16 }, helperText: { fontSize: 14, marginBottom: 20 }, modalFooter: { flexDirection: 'row', gap: 12 }, cancelBtn: { flex: 1, paddingVertical: 16, borderRadius: 12, alignItems: 'center' }, cancelBtnText: { fontSize: 16, fontWeight: 'bold' }, confirmBtn: { flex: 1, paddingVertical: 16, borderRadius: 12, alignItems: 'center' }, confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});