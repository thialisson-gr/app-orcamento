// app/(tabs)/profile.tsx
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { signOut } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ExportPDFButton } from '../../components/ExportPDFButton';
import { ScreenHeader } from '../../components/ScreenHeader';
import { SplitRuleModal } from '../../components/SplitRuleModal';
import { ThemeSelector } from '../../components/ThemeSelector';
import { UserProfileCard } from '../../components/UserProfileCard';
import { useAccounts } from '../../hooks/useAccounts';
import { useIdentity } from '../../hooks/useIdentity';
import { useTheme } from '../../hooks/useTheme';
import { useTransactions } from '../../hooks/useTransactions';
import { auth } from '../../services/firebase/config';
import { buscarRegraPadrao, salvarRegraPadrao } from '../../services/firebase/firestore';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function ProfileScreen() {
  const { isDarkMode, colors } = useTheme();
  const { contas } = useAccounts();
  const { transacoes } = useTransactions();
  const { perfil } = useIdentity(); 
  
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

  const nomeDoParceiro = perfil === 'RAY' ? 'Thialisson' : 'Rayane';

  useEffect(() => { buscarRegraPadrao().then(regra => setRegraEu(regra.me)); }, []);

  const handleSalvarRegra = async () => {
    await salvarRegraPadrao(regraEu, regraRay);
    setModalRegraVisible(false);
  };

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' }, 
      { text: 'Sair', style: 'destructive', onPress: async () => await signOut(auth) }
    ]);
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
      const despesasMes = transacoes.filter(t => {
        if (t.type !== 'DESPESA') return false; 
        const dataIso = t.paymentDate || t.date; 
        if (!dataIso) return false;
        const dataObj = new Date(dataIso);
        return dataObj.getMonth() === mesAtual && dataObj.getFullYear() === anoAtual;
      });

      const ordemTipo: Record<string, number> = { 'COMUM': 1, 'INDIVIDUAL': 2, 'TERCEIROS': 3 };
      const contasOrdenadas = contas
        .filter(c => c.tipo !== 'RECEITA') 
        .sort((a, b) => (ordemTipo[a.tipo] || 99) - (ordemTipo[b.tipo] || 99));

      let html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body { font-family: Helvetica, Arial, sans-serif; padding: 20px; color: #1e293b; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid ${colors.accent}; padding-bottom: 15px; }
              h1 { color: ${colors.accent}; margin: 0; font-size: 24px; }
              p.subtitle { color: #64748b; font-size: 14px; margin-top: 5px; }
              .tabela-container { margin-bottom: 30px; page-break-inside: avoid; }
              .tabela-titulo { background-color: #f1f5f9; padding: 10px 15px; border-radius: 6px; font-size: 16px; color: #0f172a; margin-bottom: 10px; border-left: 4px solid ${colors.accent}; }
              table { width: 100%; border-collapse: collapse; font-size: 14px; }
              th { background-color: #e2e8f0; color: #334155; padding: 10px; text-align: left; }
              td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
              .valor { font-weight: bold; color: #ef4444; }
              .total-tabela { text-align: right; padding: 10px; font-size: 14px; font-weight: bold; background-color: #f8fafc; border-top: 1px solid #e2e8f0; }
              
              .totais-finais-container { margin-top: 40px; page-break-inside: avoid; }
              .titulo-resumo { font-size: 18px; font-weight: bold; color: #0f172a; margin-bottom: 15px; text-align: center; }
              .bloco-simples { display: flex; justify-content: space-between; padding: 15px 20px; border-radius: 8px; color: white; font-size: 16px; font-weight: bold; margin-bottom: 10px; }
              
              .bloco-comum { padding: 15px 20px; border-radius: 8px; color: white; margin-bottom: 10px; background-color: ${colors.accent}; }
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

      let totalComum = 0;
      let totalMinhaParte = 0; 
      let totalParteParceiro = 0; 
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

        if (conta.tipo === 'COMUM') {
          totalComum += totalConta;
          
          const percThialisson = conta.splitRule?.me ?? 50;
          const percRayane = conta.splitRule?.spouse ?? (100 - percThialisson);
          
          const valorThialisson = totalConta * (percThialisson / 100);
          const valorRayane = totalConta * (percRayane / 100);
          
          if (perfil === 'RAY') {
            totalMinhaParte += valorRayane;
            totalParteParceiro += valorThialisson;
          } else {
            totalMinhaParte += valorThialisson;
            totalParteParceiro += valorRayane;
          }
          
        } else if (conta.tipo === 'INDIVIDUAL') {
          totalIndividual += totalConta;
        } else if (conta.tipo === 'TERCEIROS') {
          totalTerceiros += totalConta;
        }

        html += `</table><div class="total-tabela">Total da Tabela: R$ ${totalConta.toFixed(2).replace('.', ',')}</div></div>`;
      });

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
                <span>Minha Parte: R$ ${totalMinhaParte.toFixed(2).replace('.', ',')}</span>
                <span>Parte de ${nomeDoParceiro}: R$ ${totalParteParceiro.toFixed(2).replace('.', ',')}</span>
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
      <ScreenHeader title="Perfil" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* === CARTÃO DE USUÁRIO === */}
        <UserProfileCard inicial={inicial} nomeExibicao={nomeExibicao} emailLogado={emailLogado} />

        {/* === APARÊNCIA === */}
        <Text style={[styles.sectionTitle, { color: colors.subText }]}>Aparência do App</Text>
        <ThemeSelector />

        {/* === CONFIGURAÇÕES === */}
        <Text style={[styles.sectionTitle, { color: colors.subText }]}>Configurações</Text>
        <View style={[styles.menuGroup, { backgroundColor: colors.card, borderColor: isDarkMode ? '#334155' : 'transparent', borderWidth: isDarkMode ? 1 : 0 }]}>
          <TouchableOpacity style={styles.menuItem} onPress={() => setModalRegraVisible(true)} activeOpacity={0.7}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: colors.accentLight }]}><Ionicons name="people" size={20} color={colors.accent} /></View>
              <Text style={[styles.menuItemText, { color: colors.text }]}>Regra Padrão do Casal ({regraEu}/{regraRay})</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={isDarkMode ? '#4b5563' : '#d1d5db'} />
          </TouchableOpacity>
        </View>

        {/* === RELATÓRIOS (PDF) === */}
        <Text style={[styles.sectionTitle, { color: colors.subText }]}>Relatórios</Text>
        <View style={[styles.menuGroup, { backgroundColor: colors.card, padding: 20, borderColor: isDarkMode ? '#334155' : 'transparent', borderWidth: isDarkMode ? 1 : 0 }]}>
          
          {/* Seletor de Mês (Trazendo ele de volta!) */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc', padding: 6, borderRadius: 30, marginBottom: 20, borderWidth: 1, borderColor: isDarkMode ? '#334155' : '#e2e8f0' }}>
            <TouchableOpacity onPress={irMesAnterior} style={{ padding: 10, backgroundColor: colors.accentLight, borderRadius: 24 }}><Ionicons name="chevron-back" size={16} color={colors.accent} /></TouchableOpacity>
            <Text style={{ fontSize: 15, fontWeight: 'bold', color: colors.text }}>{mesFormatado}</Text>
            <TouchableOpacity onPress={irProximoMes} style={{ padding: 10, backgroundColor: colors.accentLight, borderRadius: 24 }}><Ionicons name="chevron-forward" size={16} color={colors.accent} /></TouchableOpacity>
          </View>

          {/* O NOVO botão de Exportar */}
          <ExportPDFButton isExporting={isExporting} onPress={exportarPDF} />
          
        </View>

        {/* === CONTA === */}
        <Text style={[styles.sectionTitle, { color: colors.subText }]}>Conta</Text>
        <View style={[styles.menuGroup, { backgroundColor: colors.card, borderColor: isDarkMode ? '#334155' : 'transparent', borderWidth: isDarkMode ? 1 : 0 }]}>
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout} activeOpacity={0.7}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2' }]}><Ionicons name="log-out" size={20} color="#ef4444" /></View>
              <Text style={[styles.menuItemText, { color: '#ef4444', fontWeight: 'bold' }]}>Sair do Aplicativo</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* MODAL DE REGRA (COMPONENTE) */}
      <SplitRuleModal 
        visible={modalRegraVisible} 
        onClose={() => setModalRegraVisible(false)} 
        onSave={handleSalvarRegra} 
        regraEu={regraEu} 
        setRegraEu={setRegraEu} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 100 }, 
    
  sectionTitle: { fontSize: 13, fontWeight: 'bold', marginBottom: 10, marginLeft: 8, textTransform: 'uppercase', letterSpacing: 0.5 }, 
  menuGroup: { borderRadius: 24, overflow: 'hidden', marginBottom: 24, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 }, 
  
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 }, 
  menuItemLeft: { flexDirection: 'row', alignItems: 'center' }, 
  menuIconBox: { width: 44, height: 44, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 }, 
  menuItemText: { fontSize: 16, fontWeight: '600' }
});