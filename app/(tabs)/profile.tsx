// app/(tabs)/profile.tsx
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useTransactions } from '../../hooks/useTransactions';
import { auth } from '../../services/firebase/config';

// 👇 Importando as ferramentas nativas de exportação
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function ProfileScreen() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Precisamos puxar as transações para poder exportá-las
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

  // --- MÓDULO DE EXPORTAÇÃO ---
  const formatarMoeda = (valor: number) => `R$ ${valor.toFixed(2).replace('.', ',')}`;
  const formatarData = (dataIso: string) => new Date(dataIso).toLocaleDateString('pt-BR');

  const gerarPDF = async () => {
    setIsExporting(true);
    try {
      // Montando a tabela de transações em HTML (Design do PDF)
      const linhasTabela = transacoes.map(t => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formatarData(t.paymentDate || t.date)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${t.descricao}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${t.accountId}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; color: ${t.type === 'RECEITA' ? 'green' : 'red'};">
            ${t.type === 'RECEITA' ? '+' : '-'}${formatarMoeda(t.amount)}
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${t.isPaid ? 'Concluído' : 'Pendente'}</td>
        </tr>
      `).join('');

      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: Helvetica, Arial, sans-serif; padding: 20px; color: #333; }
              h1 { color: #1e3a8a; text-align: center; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
              th { background-color: #f3f4f6; padding: 10px; text-align: left; border-bottom: 2px solid #ccc; }
            </style>
          </head>
          <body>
            <h1>Relatório Financeiro</h1>
            <p><strong>Usuário:</strong> ${nomeExibicao}</p>
            <p><strong>Gerado em:</strong> ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
            
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Tabela/Conta</th>
                  <th>Valor</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${linhasTabela || '<tr><td colspan="5" style="text-align: center; padding: 10px;">Nenhuma transação encontrada.</td></tr>'}
              </tbody>
            </table>
          </body>
        </html>
      `;

      // Cria o arquivo PDF invisível no celular
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      // Abre a tela de compartilhar do celular (WhatsApp, Drive, Email...)
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });

    } catch (error) {
      Alert.alert('Erro', 'Não foi possível gerar o PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  const gerarCSV = async () => {
    setIsExporting(true);
    try {
      let csvString = "Data,Descricao,Categoria,Conta,Tipo,Valor,Status\n";

      transacoes.forEach(t => {
        const data = formatarData(t.paymentDate || t.date);
        const desc = t.descricao.replace(/,/g, ' '); // Trocando vírgula por espaço para não quebrar colunas
        const categoria = t.tags ? t.tags[0] : '';
        const conta = t.accountId;
        const tipo = t.type;
        const valor = t.amount.toFixed(2);
        const status = t.isPaid ? 'Pago' : 'Pendente';
        
        csvString += `${data},${desc},${categoria},${conta},${tipo},${valor},${status}\n`;
      });

      // ESTRATÉGIA NOVA 1: Nome único para não dar conflito de arquivo duplicado no cache
      const nomeArquivo = `relatorio_${Date.now()}.csv`;
      const file = new FileSystem.File(FileSystem.Paths.cache, nomeArquivo);

      // Escreve usando o novo API de FileSystem (Paths + File) e encoding diretamente como string
      file.write(csvString, { encoding: 'utf8' });

      // ESTRATÉGIA NOVA 2: Compartilhamento bruto. Sem forçar UTI ou MimeType. O Android que lute.
      await Sharing.shareAsync(file.uri, { dialogTitle: 'Exportar Planilha' });

    } catch (error: any) {
      // ESTRATÉGIA NOVA 3: O App agora é obrigado a "dedurar" o erro real.
      Alert.alert('Erro ao exportar', error.message || 'Falha desconhecida pelo sistema.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleMenuExportar = () => {
    if (transacoes.length === 0) {
      return Alert.alert('Aviso', 'Você não possui transações para exportar ainda.');
    }

    Alert.alert(
      'Exportar Relatório',
      'Como deseja exportar os seus dados?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: '📄 Arquivo PDF', onPress: gerarPDF },
        { text: '📊 Planilha Excel (CSV)', onPress: gerarCSV }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meu Perfil</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* CARD DO USUÁRIO */}
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

        {/* SEÇÃO: PREFERÊNCIAS */}
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

        {/* SEÇÃO: DADOS E CONTAS */}
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

          {/* 👇 Botão de Exportar atualizado! */}
          <TouchableOpacity style={styles.menuItem} onPress={handleMenuExportar} activeOpacity={0.7} disabled={isExporting}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: '#ecfdf5' }]}>
                {isExporting ? <ActivityIndicator color="#10b981" /> : <Ionicons name="download" size={20} color="#10b981" />}
              </View>
              <Text style={styles.menuItemText}>Exportar Planilha / PDF</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
          </TouchableOpacity>
        </View>

        {/* SEÇÃO: SEGURANÇA */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' }, header: { padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 50, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }, headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' }, scrollContent: { padding: 20, paddingBottom: 100 }, userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 20, borderRadius: 16, marginBottom: 24, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 }, avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', marginRight: 16 }, avatarText: { fontSize: 24, fontWeight: 'bold', color: '#ffffff' }, userInfo: { flex: 1 }, userName: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 4, textTransform: 'capitalize' }, userEmail: { fontSize: 14, color: '#6b7280' }, editBtn: { padding: 8, backgroundColor: '#eff6ff', borderRadius: 12 }, sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#6b7280', marginBottom: 12, marginLeft: 4, textTransform: 'uppercase' }, menuGroup: { backgroundColor: '#ffffff', borderRadius: 16, overflow: 'hidden', marginBottom: 24, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 }, menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }, menuItemLeft: { flexDirection: 'row', alignItems: 'center' }, menuIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 }, menuItemText: { fontSize: 16, fontWeight: '500', color: '#1f2937' }, divider: { height: 1, backgroundColor: '#f3f4f6', marginLeft: 68 }, appVersion: { textAlign: 'center', color: '#9ca3af', fontSize: 12, marginTop: 10 },
});