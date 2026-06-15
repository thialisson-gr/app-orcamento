// app/(tabs)/index.tsx
import { router } from 'expo-router'; // 👈 Importado o router para a navegação da edição
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';
import { BalanceSummaryCard } from '../../components/BalanceSummaryCard';
import { JointExpensesCard } from '../../components/JointExpensesCard';
import { MiniStatsCards } from '../../components/MiniStatsCards';
import { MonthSelector } from '../../components/MonthSelector';
import { TransactionItem } from '../../components/TransactionItem';
import { useAccounts } from '../../hooks/useAccounts';
import { useIdentity } from '../../hooks/useIdentity';
import { useTheme } from '../../hooks/useTheme';
import { useTransactions } from '../../hooks/useTransactions';
import { deletarTransacaoDoFirebase } from '../../services/firebase/firestore';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function DashboardScreen() {
  const { transacoes, loading: loadingTransacoes } = useTransactions();
  const { contas, loadingContas } = useAccounts();
  const { colors } = useTheme(); 
  const { perfil } = useIdentity(); 

  const [dataFiltro, setDataFiltro] = useState(new Date());
  const mesAtual = dataFiltro.getMonth();
  const anoAtual = dataFiltro.getFullYear();
  const mesFormatado = `${MESES[mesAtual]} ${anoAtual}`;

  const irMesAnterior = () => setDataFiltro(new Date(anoAtual, mesAtual - 1, 1));
  const irProximoMes = () => setDataFiltro(new Date(anoAtual, mesAtual + 1, 1));

  let totalDespesasConjuntas = 0;
  let suaParteConjunta = 0;
  let parteDoOutroConjunta = 0; 
  let seusGastosIndividuais = 0;
  let aReceberTerceiros = 0;
  let suaReceitaTotal = 0;

  const nomeDoParceiro = perfil === 'RAY' ? 'Parte de Thialisson' : 'Parte de Rayane';

  transacoes.forEach((t) => {
    const dataPag = new Date(t.paymentDate || t.date);
    if (dataPag.getMonth() !== mesAtual || dataPag.getFullYear() !== anoAtual) return;
    
    if (t.type === 'RECEITA') { suaReceitaTotal += t.amount; return; } 
    if (t.isForThirdParty) { aReceberTerceiros += t.amount; return; }

    const conta = contas.find((c) => c.nome === t.accountId);
    if (conta) {
      if (conta.tipo === 'TERCEIROS') {
        aReceberTerceiros += t.amount;
      } 
      else if (conta.tipo === 'COMUM') {
        totalDespesasConjuntas += t.amount;
        
        const valorThialisson = t.amount * (conta.splitRule.me / 100);
        const valorRayane = t.amount * (conta.splitRule.spouse / 100);

        if (perfil === 'RAY') {
          suaParteConjunta += valorRayane;
          parteDoOutroConjunta += valorThialisson;
        } else {
          suaParteConjunta += valorThialisson;
          parteDoOutroConjunta += valorRayane;
        }
      } 
      else if (conta.tipo === 'INDIVIDUAL' && conta.dono === perfil) {
        seusGastosIndividuais += t.amount; 
      }
    }
  });

  const suasDespesasTotais = suaParteConjunta + seusGastosIndividuais;
  const seuSaldoRestante = suaReceitaTotal - suasDespesasTotais;
  const porcentagemGasta = suaReceitaTotal > 0 ? (suasDespesasTotais / suaReceitaTotal) * 100 : 0;

  const transacoesRecentes: any[] = [];
  const parentIdsVistos = new Set();
  transacoes.forEach((t) => {
    if (t.isInstallment && t.installmentDetails?.parentId) {
      if (!parentIdsVistos.has(t.installmentDetails.parentId)) {
        parentIdsVistos.add(t.installmentDetails.parentId);
        transacoesRecentes.push({ ...t, descricao: `${t.descricao.split(' (')[0]} (${t.installmentDetails.total}x)`, amount: t.amount * t.installmentDetails.total, dateParaExibir: t.purchaseDate || t.date });
      }
    } else if (t.isFixed && t.fixedDetails?.parentId) {
      if (!parentIdsVistos.has(t.fixedDetails.parentId)) {
        parentIdsVistos.add(t.fixedDetails.parentId);
        transacoesRecentes.push({ ...t, descricao: t.descricao, dateParaExibir: t.purchaseDate || t.date });
      }
    } else transacoesRecentes.push({ ...t, dateParaExibir: t.purchaseDate || t.date });
  });

  transacoesRecentes.sort((a, b) => new Date(b.dateParaExibir).getTime() - new Date(a.dateParaExibir).getTime());
  const ultimasTransacoes = transacoesRecentes.slice(0, 15);

  // 👇 O NOVO MENU SEGURO DE OPÇÕES
  const handleOpcoesRecentes = (item: any) => {
    const isRecorrente = item.isInstallment || item.isFixed;
    const parentId = item.isInstallment ? item.installmentDetails?.parentId : item.fixedDetails?.parentId;

    Alert.alert('Opções', `O que deseja fazer com "${item.descricao}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Editar', onPress: () => router.push({ pathname: '/edit-transaction', params: { 
          id: item.id, tipoOriginal: item.type, valorOriginal: item.amount.toString(), descOriginal: item.descricao, contaOriginal: item.accountId, dataOriginal: item.paymentDate || item.date, tagOriginal: item.tags ? item.tags[0] : '', isTerceiroOriginal: item.isForThirdParty ? 'true' : 'false', nomeTerceiroOriginal: item.thirdPartyName || '',
          isRecorrente: isRecorrente ? 'true' : 'false',
          parentId: parentId || ''
        } }) 
      },
      { text: 'Apagar', style: 'destructive', onPress: () => {
        Alert.alert('Atenção', 'Deseja realmente apagar esta transação?', [
          { text: 'Não', style: 'cancel' },
          { text: 'Sim, Apagar', style: 'destructive', onPress: () => deletarTransacaoDoFirebase(item.id) }
        ])
      }}
    ]);
  };

  if (loadingTransacoes || loadingContas) return <View style={[{ flex: 1, justifyContent: 'center', alignItems: 'center' }, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.accent} /><Text style={{ marginTop: 10, color: colors.subText, fontSize: 12 }}>Calculando finanças...</Text></View>;

  return (
    <View style={[{ flex: 1 }, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        
        {/* CABEÇALHO */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 40 }}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text }}>Olá!</Text>
            <Text style={{ fontSize: 14, color: colors.subText, marginTop: 2, fontWeight: '500' }}>Seu resumo financeiro</Text>
          </View>
          {/* SELETOR DE MÊS (PÍLULA) */}
          <MonthSelector 
                    mesFormatado={mesFormatado} 
                    onPrev={irMesAnterior} 
                    onNext={irProximoMes} 
          />
        </View>

        {/* CARTÃO DE SALDO PRINCIPAL */}
        <BalanceSummaryCard 
          saldoRestante={seuSaldoRestante} 
          porcentagemGasta={porcentagemGasta} 
          receitaTotal={suaReceitaTotal} 
          despesasTotais={suasDespesasTotais} 
        />
               
        {/* CARTÃO DE DESPESAS CONJUNTAS */}
        <JointExpensesCard 
          total={totalDespesasConjuntas} 
          minhaParte={suaParteConjunta} 
          nomeParceiro={nomeDoParceiro} 
          parteParceiro={parteDoOutroConjunta} 
        />

        {/* MINI CARDS (A RECEBER E INDIVIDUAL) */}
        <MiniStatsCards aReceber={aReceberTerceiros} individual={seusGastosIndividuais} />

        {/* LISTA RECENTES (COMPACTO HORIZONTAL MELHORADO) */}
        <View>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 16, marginLeft: 4 }}>Atividades Recentes</Text>
            {ultimasTransacoes.length === 0 ? (
            <Text style={{ color: colors.subText, textAlign: 'center', marginTop: 10, fontSize: 14, fontStyle: 'italic' }}>Nenhuma transação registrada.</Text>
          ) : (
            ultimasTransacoes.map((item: any) => (
              <TransactionItem 
                key={item.id} 
                item={item} 
                onPress={() => handleOpcoesRecentes(item)} 
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}