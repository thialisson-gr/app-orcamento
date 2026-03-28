// app/(tabs)/profile.tsx
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { signOut } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAccounts } from '../../hooks/useAccounts';
import { useTheme } from '../../hooks/useTheme';
import { useTransactions } from '../../hooks/useTransactions';
import { auth } from '../../services/firebase/config';
import { buscarRegraPadrao, salvarRegraPadrao } from '../../services/firebase/firestore';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function ProfileScreen() {
  const { isDarkMode, activeTheme, setTheme, colors } = useTheme(); 
  const { contas } = useAccounts();
  const { transacoes } = useTransactions();
  
  const [modalRegraVisible, setModalRegraVisible] = useState(false);
  const [regraEu, setRegraEu] = useState(50);
  const regraRay = 100 - regraEu;
  
  const [dataFiltro, setDataFiltro] = useState(new Date());
  const [isExporting, setIsExporting] = useState(false);

  const mesAtual = dataFiltro.getMonth();
  const anoAtual = dataFiltro.getFullYear();
  const mesFormatado = `${MESES[mesAtual]} ${anoAtual}`;

  const user = auth.currentUser;
  const emailLogado = user?.email || 'Usuário Desconhecido';
  const inicial = emailLogado.charAt(0).toUpperCase();
  const nomeExibicao = emailLogado.split('@')[0];

  useEffect(() => { buscarRegraPadrao().then(regra => setRegraEu(regra.me)); }, []);

  const handleSalvarRegra = async () => {
    await salvarRegraPadrao(regraEu, regraRay);
    setModalRegraVisible(false);
  };

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja sair?', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Sair', style: 'destructive', onPress: async () => await signOut(auth) }]);
  };

  const irMesAnterior = () => setDataFiltro(new Date(anoAtual, mesAtual - 1, 1));
  const irProximoMes = () => setDataFiltro(new Date(anoAtual, mesAtual + 1, 1));

  const formatarDataParaPDF = (isoString: string) => {
    if (!isoString) return '--/--/----';
    try {
      const d = new Date(isoString);
      const dia = String(d.getDate()).padStart(2, '0');
      const mes = String(d.getMonth() + 1).padStart(2, '0');
      const ano = d.getFullYear();
      return `${dia}/${mes}/${ano}`;
    } catch {
      return '--/--/----';
    }
  };

  const exportarPDF = async () => {
    setIsExporting(true);
    try {
      // 1. Filtrar transações
      const despesasMes = transacoes.filter(t => {
        if (t.type !== 'DESPESA') return false; 
        
        const dataIso = t.paymentDate || t.date; 
        if (!dataIso) return false;

        const dataObj = new Date(dataIso);
        return dataObj.getMonth() === mesAtual && dataObj.getFullYear() === anoAtual;
      });

      // 2. Organizar as Tabelas: COMUM -> INDIVIDUAL -> TERCEIROS
      const ordemTipo: Record<string, number> = { 'COMUM': 1, 'INDIVIDUAL': 2, 'TERCEIROS': 3 };
      const contasOrdenadas = contas
        .filter(c => c.tipo !== 'RECEITA') 
        .sort((a, b) => (ordemTipo[a.tipo] || 99) - (ordemTipo[b.tipo] || 99));

      // 3. Montar HTML com o novo CSS para os totais
      let html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body { font-family: Helvetica, Arial, sans-serif; padding: 20px; color: #1e293b; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3b82f6; padding-bottom: 15px; }
              h1 { color: #3b82f6; margin: 0; font-size: 24px; }
              p.subtitle { color: #64748b; font-size: 14px; margin-top: 5px; }
              .tabela-container { margin-bottom: 30px; page-break-inside: avoid; }
              .tabela-titulo { background-color: #f1f5f9; padding: 10px 15px; border-radius: 6px; font-size: 16px; color: #0f172a; margin-bottom: 10px; border-left: 4px solid #3b82f6; }
              table { width: 100%; border-collapse: collapse; font-size: 14px; }
              th { background-color: #e2e8f0; color: #334155; padding: 10px; text-align: left; }
              td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
              .valor { font-weight: bold; color: #ef4444; }
              .total-tabela { text-align: right; padding: 10px; font-size: 14px; font-weight: bold; background-color: #f8fafc; border-top: 1px solid #e2e8f0; }
              
              /* ESTILOS DOS TOTAIS FINAIS */
              .totais-finais-container { margin-top: 40px; page-break-inside: avoid; }
              .titulo-resumo { font-size: 18px; font-weight: bold; color: #0f172a; margin-bottom: 15px; text-align: center; }
              .bloco-simples { display: flex; justify-content: space-between; padding: 15px 20px; border-radius: 8px; color: white; font-size: 16px; font-weight: bold; margin-bottom: 10px; }
              
              .bloco-comum { padding: 15px 20px; border-radius: 8px; color: white; margin-bottom: 10px; background-color: #3b82f6; }
              .linha-total { display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; }
              .linha-divisao { display: flex; justify-content: space-between; font-size: 14px; margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.3); }
              
              .bg-individual { background-color: #8b5cf6; }
              .bg-terceiros { background-color: #ec4899; }
              
              .vazio { font-style: italic; color: #94a3b8; text-align: center; padding: 10px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Relatório de Despesas</h1>
              <p class="subtitle">Mês de Referência: ${mesFormatado}</p>
              <p class="subtitle">Gerado por: ${emailLogado}</p>
            </div>
      `;

      // Variáveis para somar os totais separados
      let totalComum = 0;
      let totalComumEu = 0;
      let totalComumRay = 0;
      let totalIndividual = 0;
      let totalTerceiros = 0;
      let temAlgumaDespesa = false;

      contasOrdenadas.forEach(conta => {
        const despesasDestaConta = despesasMes.filter(d => d.accountId === conta.nome || d.contaSelecionada === conta.nome);
        if (despesasDestaConta.length === 0) return;
        
        temAlgumaDespesa = true;
        let totalConta = 0;

        html += `
          <div class="tabela-container">
            <div class="tabela-titulo"><strong>${conta.nome}</strong> <span style="font-size: 12px; color: #64748b;">(${conta.tipo})</span></div>
            <table>
              <tr><th width="20%">Data</th><th width="40%">Descrição</th><th width="20%">Categoria</th><th width="20%" style="text-align: right;">Valor</th></tr>
        `;

        despesasDestaConta.forEach(d => {
          const vAmount = Number(d.amount) || 0;
          const vDesc = d.descricao || '-';
          const vCat = (d.tags && d.tags.length > 0) ? d.tags[0] : 'Outros';
          const vDate = formatarDataParaPDF(d.paymentDate || d.date);
          const isPago = d.isPaid === true;

          totalConta += vAmount;
          
          html += `
            <tr>
              <td>${vDate}</td>
              <td>${vDesc} ${isPago ? '✅' : '⏳'}</td>
              <td>${vCat}</td>
              <td class="valor" style="text-align: right;">R$ ${vAmount.toFixed(2).replace('.', ',')}</td>
            </tr>
          `;
        });

        // Adiciona ao totalizador correto baseado no tipo da tabela
        if (conta.tipo === 'COMUM') {
          totalComum += totalConta;
          
          // Calcula a divisão baseada na regra específica DESTA tabela
          const percEu = conta.splitRule?.me ?? 50;
          const percRay = conta.splitRule?.spouse ?? (100 - percEu);
          
          totalComumEu += totalConta * (percEu / 100);
          totalComumRay += totalConta * (percRay / 100);
          
        } else if (conta.tipo === 'INDIVIDUAL') {
          totalIndividual += totalConta;
        } else if (conta.tipo === 'TERCEIROS') {
          totalTerceiros += totalConta;
        }

        html += `</table><div class="total-tabela">Total da Tabela: R$ ${totalConta.toFixed(2).replace('.', ',')}</div></div>`;
      });

      // Renderiza os totais no final do documento
      if (!temAlgumaDespesa) {
        html += `<div class="vazio">Nenhuma despesa registrada para o mês de ${mesFormatado}.</div>`;
      } else {
        html += `
          <div class="totais-finais-container">
            <div class="titulo-resumo">RESUMO DO MÊS</div>
            
            <div class="bloco-comum">
              <div class="linha-total">
                <span>TOTAL TABELAS COMUNS</span>
                <span>R$ ${totalComum.toFixed(2).replace('.', ',')}</span>
              </div>
              <div class="linha-divisao">
                <span>Minha Parte: R$ ${totalComumEu.toFixed(2).replace('.', ',')}</span>
                <span>Parte da Ray: R$ ${totalComumRay.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>

            <div class="bloco-simples bg-individual">
              <span>TOTAL TABELAS INDIVIDUAIS</span>
              <span>R$ ${totalIndividual.toFixed(2).replace('.', ',')}</span>
            </div>
            
            <div class="bloco-simples bg-terceiros">
              <span>TOTAL TERCEIROS</span>
              <span>R$ ${totalTerceiros.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>
        `;
      }

      html += `</body></html>`;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { dialogTitle: `Relatorio_${mesFormatado.replace(' ', '_')}.pdf` });

    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      Alert.alert('Erro', 'Não foi possível gerar o PDF. Tente novamente.');
    } finally {
      setIsExporting(false); 
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: isDarkMode ? '#374151' : '#e5e7eb' }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Perfil</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* === CARTÃO DE USUÁRIO === */}
        <View style={[styles.userCard, { backgroundColor: colors.card }]}>
          <View style={[styles.avatar, { backgroundColor: colors.accent }]}><Text style={styles.avatarText}>{inicial}</Text></View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>{nomeExibicao}</Text>
            <Text style={[styles.userEmail, { color: colors.subText }]}>{emailLogado}</Text>
          </View>
        </View>

        {/* === APARÊNCIA === */}
        <Text style={[styles.sectionTitle, { color: colors.subText }]}>Aparência Vibrante</Text>
        <View style={[styles.menuGroup, { backgroundColor: colors.card, padding: 16 }]}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={() => setTheme('indigo')} style={[styles.themeOption, activeTheme === 'indigo' && { borderColor: '#6366f1', borderWidth: 2 }]}>
              <View style={[styles.colorCircle, { backgroundColor: '#6366f1' }]} />
              <Text style={{ fontSize: 11, color: colors.text, marginTop: 6, fontWeight: activeTheme === 'indigo' ? 'bold' : 'normal' }}>Índigo</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setTheme('pink')} style={[styles.themeOption, activeTheme === 'pink' && { borderColor: '#ec4899', borderWidth: 2 }]}>
              <View style={[styles.colorCircle, { backgroundColor: '#ec4899' }]} />
              <Text style={{ fontSize: 11, color: colors.text, marginTop: 6, fontWeight: activeTheme === 'pink' ? 'bold' : 'normal' }}>Pink</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setTheme('dark')} style={[styles.themeOption, activeTheme === 'dark' && { borderColor: '#06b6d4', borderWidth: 2 }]}>
              <View style={[styles.colorCircle, { backgroundColor: '#1e293b', borderWidth: 2, borderColor: '#06b6d4' }]} />
              <Text style={{ fontSize: 11, color: colors.text, marginTop: 6, fontWeight: activeTheme === 'dark' ? 'bold' : 'normal' }}>Cyber</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* === CONFIGURAÇÕES === */}
        <Text style={[styles.sectionTitle, { color: colors.subText }]}>Configurações</Text>
        <View style={[styles.menuGroup, { backgroundColor: colors.card }]}>
          <TouchableOpacity style={styles.menuItem} onPress={() => setModalRegraVisible(true)} activeOpacity={0.7}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: colors.accentLight }]}><Ionicons name="people" size={18} color={colors.accent} /></View>
              <Text style={[styles.menuItemText, { color: colors.text }]}>Regra Padrão ({regraEu}/{regraRay})</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={isDarkMode ? '#4b5563' : '#d1d5db'} />
          </TouchableOpacity>
        </View>

        {/* === RELATÓRIOS (PDF) === */}
        <Text style={[styles.sectionTitle, { color: colors.subText }]}>Relatórios</Text>
        <View style={[styles.menuGroup, { backgroundColor: colors.card, padding: 16 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <TouchableOpacity onPress={irMesAnterior} style={{ padding: 8, backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9', borderRadius: 8 }}>
              <Ionicons name="chevron-back" size={20} color={colors.accent} />
            </TouchableOpacity>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>{mesFormatado}</Text>
            <TouchableOpacity onPress={irProximoMes} style={{ padding: 8, backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9', borderRadius: 8 }}>
              <Ionicons name="chevron-forward" size={20} color={colors.accent} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.exportBtn, { backgroundColor: colors.accent }, isExporting && { opacity: 0.7 }]} onPress={exportarPDF} disabled={isExporting}>
            {isExporting ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name="document-text" size={20} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: 'bold', marginLeft: 8 }}>Exportar Relatório PDF</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* === CONTA === */}
        <Text style={[styles.sectionTitle, { color: colors.subText }]}>Conta</Text>
        <View style={[styles.menuGroup, { backgroundColor: colors.card }]}>
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout} activeOpacity={0.7}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: isDarkMode ? '#7f1d1d' : '#fef2f2' }]}><Ionicons name="log-out" size={18} color="#ef4444" /></View>
              <Text style={[styles.menuItemText, { color: '#ef4444', fontWeight: 'bold' }]}>Sair</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* MODAL DE REGRA */}
      <Modal animationType="slide" transparent={true} visible={modalRegraVisible} onRequestClose={() => setModalRegraVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Regra Padrão</Text>
            <View style={{ backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc', padding: 16, borderRadius: 24, marginBottom: 20, borderWidth: isDarkMode ? 1 : 0, borderColor: '#334155' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>Sua Parte</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: isDarkMode ? '#475569' : '#e2e8f0' }}>
                  <TouchableOpacity onPress={() => regraEu > 0 && setRegraEu(regraEu - 1)} style={{ padding: 12 }}><Ionicons name="remove" size={16} color={colors.accent}/></TouchableOpacity>
                  <Text style={{ width: 36, textAlign: 'center', fontSize: 14, fontWeight: 'bold', color: colors.text }}>{regraEu}%</Text>
                  <TouchableOpacity onPress={() => regraEu < 100 && setRegraEu(regraEu + 1)} style={{ padding: 12 }}><Ionicons name="add" size={16} color={colors.accent}/></TouchableOpacity>
                </View>
              </View>
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: isDarkMode ? '#334155' : '#f1f5f9' }]} onPress={() => setModalRegraVisible(false)}><Text style={[styles.cancelBtnText, { color: isDarkMode ? '#cbd5e1' : '#64748b' }]}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: colors.accent }]} onPress={handleSalvarRegra}><Text style={styles.confirmBtnText}>Salvar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, 
  header: { padding: 16, paddingTop: Platform.OS === 'ios' ? 60 : 50, borderBottomWidth: 1, alignItems: 'center' }, 
  headerTitle: { fontSize: 18, fontWeight: 'bold' }, scrollContent: { padding: 16, paddingBottom: 100 }, 
  userCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 6, marginBottom: 20, elevation: 1 }, 
  avatar: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginRight: 12 }, 
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' }, userInfo: { flex: 1 }, 
  userName: { fontSize: 18, fontWeight: 'bold', marginBottom: 2, textTransform: 'capitalize' }, 
  userEmail: { fontSize: 12 }, 
  sectionTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 8, marginLeft: 8, textTransform: 'uppercase' }, 
  menuGroup: { borderRadius: 6, overflow: 'hidden', marginBottom: 20, elevation: 1 }, 
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }, 
  menuItemLeft: { flexDirection: 'row', alignItems: 'center' }, 
  menuIconBox: { width: 46, height: 46, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 12 }, 
  menuItemText: { fontSize: 15, fontWeight: '500' }, divider: { height: 1, marginLeft: 64 }, 
  themeOption: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 6, borderWidth: 1, borderColor: 'transparent', backgroundColor: 'rgba(0,0,0,0.03)' }, 
  colorCircle: { width: 36, height: 36, borderRadius: 18, elevation: 2 },
  exportBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 14, borderRadius: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }, 
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 }, 
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }, 
  modalFooter: { flexDirection: 'row', gap: 12 }, 
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 6, alignItems: 'center' }, 
  cancelBtnText: { fontSize: 15, fontWeight: 'bold' }, 
  confirmBtn: { flex: 1, paddingVertical: 14, borderRadius: 6, alignItems: 'center' }, 
  confirmBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' }
});