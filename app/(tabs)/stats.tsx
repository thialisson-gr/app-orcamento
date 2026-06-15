// app/(tabs)/stats.tsx
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, LayoutAnimation, ScrollView, Text, View } from 'react-native';
import { DonutLegend } from '../../components/DonutLegend';
import { ExpensesDonutChart } from '../../components/ExpensesDonutChart';
import { MonthClosingCard } from '../../components/MonthClosingCard';
import { MonthSelector } from '../../components/MonthSelector';
import { ReceivablesCard } from '../../components/ReceivablesCard';
import { ScreenHeader } from '../../components/ScreenHeader';
import { TrendLineChart } from '../../components/TrendLineChart';
import { useAccounts } from '../../hooks/useAccounts';
import { useIdentity } from '../../hooks/useIdentity';
import { useTheme } from '../../hooks/useTheme';
import { useTransactions } from '../../hooks/useTransactions';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const CORES = ['#00d09c', '#3b82f6', '#f59e0b', '#8b5cf6', '#f43f5e', '#0ea5e9', '#d946ef', '#14b8a6', '#f97316'];

const offsetsMeses = [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export default function StatsScreen() {
  const { transacoes, loading: loadingTx } = useTransactions();
  const { contas, loadingContas } = useAccounts();
  const { colors, isDarkMode } = useTheme(); 
  const { perfil } = useIdentity(); 

  const [dataFiltro, setDataFiltro] = useState(new Date());
  const mesAtual = dataFiltro.getMonth();
  const anoAtual = dataFiltro.getFullYear();
  const mesFormatado = `${MESES[mesAtual]} ${anoAtual}`;

  const animateTransition = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  const irMesAnterior = () => {
    animateTransition();
    setDataFiltro(new Date(anoAtual, mesAtual - 1, 1));
  };

  const irProximoMes = () => {
    animateTransition();
    setDataFiltro(new Date(anoAtual, mesAtual + 1, 1));
  };

  const { totalDespesas, totalTerceirosCard, despesasPorTabela } = useMemo(() => {
    let totalDesp = 0;
    let totalTerceiros = 0;
    const porTabela: Record<string, number> = {};

    transacoes.forEach(t => {
      const dataPag = new Date(t.paymentDate || t.date);
      if (dataPag.getMonth() !== mesAtual || dataPag.getFullYear() !== anoAtual) return;

      const conta = contas.find(c => c.nome === t.accountId);
      if (!conta) return;

      const isTerceiro = (conta.tipo === 'TERCEIROS') || t.isForThirdParty;

      if (isTerceiro) {
        if (t.type === 'DESPESA') totalTerceiros += t.amount;
        return;
      }

      if (conta.tipo === 'INDIVIDUAL' && conta.dono !== perfil) return;

      let suaParte = t.amount;
      if (conta.tipo === 'COMUM') {
        const perc = perfil === 'RAY' ? (conta.splitRule?.spouse ?? 50) : (conta.splitRule?.me ?? 50);
        suaParte = t.amount * (perc / 100);
      }

      if (t.type === 'DESPESA' && suaParte > 0) {
        totalDesp += suaParte;
        if (!porTabela[t.accountId]) porTabela[t.accountId] = 0;
        porTabela[t.accountId] += suaParte;
      }
    });

    return { totalDespesas: totalDesp, totalTerceirosCard: totalTerceiros, despesasPorTabela: porTabela };
  }, [transacoes, contas, mesAtual, anoAtual, perfil]);

  const tabelasParaSoma = useMemo(() => {
    return Object.keys(despesasPorTabela)
      .map(key => ({ nome: key, valor: despesasPorTabela[key] }))
      .filter(t => t.valor > 0)
      .sort((a, b) => b.valor - a.valor);
  }, [despesasPorTabela]);

  const dadosGraficoPizzaGifted = useMemo(() => {
    let colorIndexLocal = 0;
    return tabelasParaSoma.map((tabela) => {
        const cor = CORES[colorIndexLocal % CORES.length];
        colorIndexLocal++;
        return { value: tabela.valor, color: cor, label: tabela.nome };
      });
  }, [tabelasParaSoma]);

  const totalGastoString = useMemo(() => totalDespesas.toFixed(2).split('.'), [totalDespesas]);

  const dadosEvolucaoPremiumLine = useMemo(() => {
    const hoje = new Date(); 
    
    return offsetsMeses.map(offset => {
      const dataRef = new Date(hoje.getFullYear(), hoje.getMonth() + offset, 1);
      let totalGastoNoMes = 0;
      
      transacoes.forEach(t => {
        const d = new Date(t.paymentDate || t.date);
        if (d.getMonth() === dataRef.getMonth() && d.getFullYear() === dataRef.getFullYear()) {
          const conta = contas.find(c => c.nome === t.accountId);
          
          if (conta && t.type === 'DESPESA' && !(conta.tipo === 'TERCEIROS' || t.isForThirdParty) && !(conta.tipo === 'INDIVIDUAL' && conta.dono !== perfil)) {
            let suaParte = t.amount;
            if (conta.tipo === 'COMUM') {
              const perc = perfil === 'RAY' ? (conta.splitRule?.spouse ?? 50) : (conta.splitRule?.me ?? 50);
              suaParte = t.amount * (perc / 100);
            }
            totalGastoNoMes += suaParte;
          }
        }
      });

      const isMesAtual = offset === 0;
      const corPonto = isMesAtual ? '#f59e0b' : colors.accent;
      const valorFormatado = Math.round(totalGastoNoMes).toLocaleString('pt-BR');

      return {
        value: Math.round(totalGastoNoMes),
        label: `${MESES[dataRef.getMonth()].substring(0, 3)}`,
        labelTextStyle: { 
          color: isMesAtual ? colors.text : colors.subText, 
          fontSize: 12, 
          fontWeight: (isMesAtual ? 'bold' : 'normal') as 'bold' | 'normal',
          marginTop: 0,
          paddingLeft: 8,
        },
        customDataPoint: () => (
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ position: 'absolute', top: 12, width: 0, height: 300, borderLeftWidth: 1, borderStyle: 'dashed', borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }} />
            <View style={{ width: 16, height: 16, borderRadius: 9, backgroundColor: isDarkMode ? '#0f172a' : '#fff', borderWidth: 3, borderColor: corPonto, shadowColor: corPonto, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 3, elevation: 4, marginTop: -5 }} />
          </View>
        ),
        dataPointLabelComponent: () => (
          <View style={{ backgroundColor: isMesAtual ? corPonto : (isDarkMode ? '#334155' : '#f1f5f9'), paddingHorizontal: 2, paddingVertical: 3, borderRadius: 10, marginBottom: 10, marginLeft: 9, marginTop: 6, transform: [{ translateX: -14 }], shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2, minWidth: 50, alignItems: 'center' }}>
            <Text style={{ color: isMesAtual ? '#fcfcfc' : colors.text, fontSize: 13, fontWeight: 'bold' }}>{valorFormatado}</Text>
          </View>
        ),
      };
    });
  }, [transacoes, contas, colors, isDarkMode, perfil]);
 

  const tabelasBalanco = useMemo(() => {
    const totais: Record<string, { valor: number; tipo: string }> = {};

    transacoes.forEach(t => {
      const dataPag = new Date(t.paymentDate || t.date);
      if (dataPag.getMonth() !== mesAtual || dataPag.getFullYear() !== anoAtual) return;

      const conta = contas.find(c => c.nome === t.accountId);
      if (!conta) return;

      if (conta.tipo === 'TERCEIROS' || t.isForThirdParty) return;
      if (conta.tipo === 'INDIVIDUAL' && conta.dono !== perfil) return;

      let suaParte = t.amount;
      if (conta.tipo === 'COMUM') {
        const perc = perfil === 'RAY' ? (conta.splitRule?.spouse ?? 50) : (conta.splitRule?.me ?? 50);
        suaParte = t.amount * (perc / 100);
      }

      if (suaParte > 0) {
        if (!totais[t.accountId]) {
          totais[t.accountId] = { valor: 0, tipo: t.type };
        }
        totais[t.accountId].valor += suaParte;
      }
    });

    return Object.keys(totais)
      .map(nome => ({ nome, valor: totais[nome].valor, tipo: totais[nome].tipo }))
      .sort((a, b) => {
        if (a.tipo === 'RECEITA' && b.tipo === 'DESPESA') return -1;
        if (a.tipo === 'DESPESA' && b.tipo === 'RECEITA') return 1;
        return b.valor - a.valor;
      });
  }, [transacoes, contas, mesAtual, anoAtual, perfil]);

  const saldoFinalBalanco = useMemo(() => {
    return tabelasBalanco.reduce((acc, t) => t.tipo === 'RECEITA' ? acc + t.valor : acc - t.valor, 0);
  }, [tabelasBalanco]);

  if (loadingTx || loadingContas) return <View style={[{ flex: 1, justifyContent: 'center', alignItems: 'center' }, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.accent} /></View>;

  return (
    <View style={[{ flex: 1 }, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Estatísticas" />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        
        {/* SELETOR DE MÊS (PÍLULA) */}
        <MonthSelector 
          mesFormatado={mesFormatado} 
          onPrev={irMesAnterior} 
          onNext={irProximoMes} 
        />

        <ReceivablesCard total={totalTerceirosCard} />

        {/* ROSCA (DONUT) DO MÊS */}
        {/* ROSCA (DONUT) DO MÊS (COMPONENTE) */}
        <ExpensesDonutChart 
          data={dadosGraficoPizzaGifted} 
          totalDespesas={totalDespesas} 
          totalGastoString={totalGastoString} 
        />

        {/* A LEGENDA DA ROSCA */}
        {/* LEGENDA DA ROSCA (COMPONENTE) */}
        <DonutLegend data={dadosGraficoPizzaGifted} totalDespesas={totalDespesas} />

        {/* GRÁFICO DE ÁREA PREMIUM (COMPONENTE) */}
        <TrendLineChart data={dadosEvolucaoPremiumLine} />

        {/* O CARTÃO DE BALANÇO EXATO */}
        <MonthClosingCard balanco={tabelasBalanco} saldoFinal={saldoFinalBalanco} />

      </ScrollView>
    </View>
  );
}
