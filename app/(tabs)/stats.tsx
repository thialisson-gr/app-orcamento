// app/(tabs)/stats.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, LayoutAnimation, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, UIManager, View } from 'react-native';
// 👇 A MÁGICA 1: Usamos apenas a biblioteca premium agora!
import { LineChart, PieChart } from 'react-native-gifted-charts';
import { useAccounts } from '../../hooks/useAccounts';
import { useTheme } from '../../hooks/useTheme'; // 👈 IMPORT TEMA
import { useTransactions } from '../../hooks/useTransactions';

const screenWidth = Dimensions.get('window').width;
const cardWidth = screenWidth - 32; // Ajustado para padding 16 
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const CORES = ['#00d09c', '#3b82f6', '#f59e0b', '#8b5cf6', '#f43f5e', '#0ea5e9', '#d946ef', '#14b8a6', '#f97316'];

export default function StatsScreen() {
  const { transacoes, loading: loadingTx } = useTransactions();
  const { contas, loadingContas } = useAccounts();
  const { colors, isDarkMode, activeTheme } = useTheme(); // 👈 PUXANDO CORES
  const scrollGraficoRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

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

  const voltarParaHoje = () => {
    animateTransition();
    setDataFiltro(new Date());
  };

  // --- LÓGICA 1: ROSCA (DONUT) DO MÊS ---
  const { totalDespesas, totalReceitas, totalTerceirosCard, despesasPorTabela } = useMemo(() => {
    let totalDesp = 0;
    let totalRec = 0;
    let totalTerceiros = 0;
    const porTabela: Record<string, number> = {};

    transacoes.forEach(t => {
      const dataPag = new Date(t.paymentDate || t.date);
      if (dataPag.getMonth() !== mesAtual || dataPag.getFullYear() !== anoAtual) return;

      const conta = contas.find(c => c.nome === t.accountId);
      const isTerceiro = (conta && conta.tipo === 'TERCEIROS') || t.isForThirdParty;

      if (isTerceiro) {
        if (t.type === 'DESPESA') totalTerceiros += t.amount;
        return;
      }

      if (t.type === 'DESPESA') {
        totalDesp += t.amount;
        if (!porTabela[t.accountId]) porTabela[t.accountId] = 0;
        porTabela[t.accountId] += t.amount;
      }

      if (t.type === 'RECEITA') {
        totalRec += t.amount;
      }
    });

    return { totalDespesas: totalDesp, totalReceitas: totalRec, totalTerceirosCard: totalTerceiros, despesasPorTabela: porTabela };
  }, [transacoes, contas, mesAtual, anoAtual]);

  // 👇 MUDANÇA: Prepara os dados pro formato da Gifted Pie
  const dadosGraficoPizzaGifted = useMemo(() => {
    let colorIndexLocal = 0;
    return Object.keys(despesasPorTabela)
      .sort((a, b) => despesasPorTabela[b] - despesasPorTabela[a])
      .map((nomeTabela) => {
        const valor = despesasPorTabela[nomeTabela];
        const cor = CORES[colorIndexLocal % CORES.length];
        colorIndexLocal++;
        return { value: valor, color: cor, label: nomeTabela };
      });
  }, [despesasPorTabela]);

  const totalGastoString = useMemo(() => totalDespesas.toFixed(2).split('.'), [totalDespesas]);

  // --- LÓGICA 2: GRÁFICO DE ÁREA PREMIUM (Gifted Charts) ---
  const offsetsMeses = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];
  const hoje = new Date();

  const dadosEvolucaoPremiumLine = useMemo(() => {
    return offsetsMeses.map(offset => {
      const dataRef = new Date(hoje.getFullYear(), hoje.getMonth() + offset, 1);
      let totalGastoNoMes = 0;
      transacoes.forEach(t => {
        const d = new Date(t.paymentDate || t.date);
        if (d.getMonth() === dataRef.getMonth() && d.getFullYear() === dataRef.getFullYear()) {
          const conta = contas.find(c => c.nome === t.accountId);
          if (t.type === 'DESPESA' && !(conta?.tipo === 'TERCEIROS' || t.isForThirdParty)) {
            totalGastoNoMes += t.amount;
          }
        }
      });

      const isMesAtual = offset === 0;
      const valorArredondado = Math.round(totalGastoNoMes);

      return {
        value: valorArredondado,
        label: `${MESES[dataRef.getMonth()].substring(0, 3)}/${String(dataRef.getFullYear()).substring(2)}`,
        // 👇 Customização pro Area Chart
        dataPointColor: isMesAtual ? '#f59e0b' : colors.accent,
        labelTextStyle: { color: colors.subText, fontSize: 10 },
      };
    });
  }, [transacoes, contas, colors]);

  const larguraTotalBarras = offsetsMeses.length * 70;
  const saldo = totalReceitas - totalDespesas;
  const temDadosEvolucao = dadosEvolucaoPremiumLine.some(item => item.value > 0);

  if (loadingTx || loadingContas) return <View style={[{ flex: 1, justifyContent: 'center', alignItems: 'center' }, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.accent} /></View>;

  return (
    <View style={[{ flex: 1 }, { backgroundColor: colors.background }]}>
      <View style={[styles.compactHeader, { backgroundColor: colors.card, borderBottomColor: isDarkMode ? '#374151' : '#e5e7eb' }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Estatísticas</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {/* MES SELECIONADOR COMPACTO (Igual ao do Dashboard) */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.card, padding: 8, borderRadius: 16, marginBottom: 12, elevation: 2, borderWidth: isDarkMode ? 1 : 0, borderColor: '#374151' }}>
          <TouchableOpacity onPress={irMesAnterior} style={{ padding: 8, backgroundColor: colors.accentLight, borderRadius: 12 }}><Ionicons name="chevron-back" size={16} color={colors.accent} /></TouchableOpacity>
          <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.text }}>{mesFormatado}</Text>
          <TouchableOpacity onPress={irProximoMes} style={{ padding: 8, backgroundColor: colors.accentLight, borderRadius: 12 }}><Ionicons name="chevron-forward" size={16} color={colors.accent} /></TouchableOpacity>
        </View>


        {totalTerceirosCard > 0 && (
          <View style={{ backgroundColor: isDarkMode ? '#4c1d95' : '#fdf2f8', padding: 12, borderRadius: 16, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ fontSize: 11, color: isDarkMode ? '#f9a8d4' : '#be185d', marginBottom: 2 }}>A Receber (Terceiros)</Text>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: isDarkMode ? '#fbcfe8' : '#be185d' }}>R$ {totalTerceirosCard.toFixed(2)}</Text>
              </View>
              <Ionicons name="people-outline" size={20} color={isDarkMode ? '#fbcfe8' : '#be185d'} />
            </View>
          </View>
        )}

        {/* 👇 A MÁGICA 2: O NOVO DONUT CHART */}
        <View style={{ backgroundColor: colors.card, borderRadius: 20, padding: 16, marginBottom: 16, alignItems: 'center', elevation: 2 }}>
          <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.text, marginBottom: 16, width: '100%' }}>Seus Gastos ({MESES[mesAtual]})</Text>
          
          {totalDespesas === 0 ? (
            <View style={{ height: 180, justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="pie-chart-outline" size={48} color={colors.subText} />
              <Text style={{ color: colors.subText, marginTop: 12, fontSize: 13 }}>Nenhuma transação.</Text>
            </View>
          ) : (
            <PieChart
              data={dadosGraficoPizzaGifted}
              donut // 👈 MÁGICA: Transforma em rosquinha
              radius={85} // Tamanho total
              innerRadius={60} // Tamanho do buraco
              isAnimated
              animationDuration={800}
              inwardExtraLengthForFocused={8}
              // 👇 Bordinha sutil no centro
              innerCircleBorderWidth={1}
              innerCircleBorderColor={isDarkMode ? '#374151' : '#f1f5f9'}
              // 👇 O TEXTO DO CENTRO (TOTAL GASTO)
              centerLabelComponent={() => {
                const centerTextColor = isDarkMode ? '#f8fafc' : '#1f2937';
                const centerSubtitleColor = isDarkMode ? '#d1d5db' : '#6b7280';
                return (
                  <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 11, color: centerSubtitleColor, marginBottom: 2 }}>Total Gasto</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                      <Text style={{ fontSize: 14, fontWeight: 'bold', color: centerTextColor, marginTop: 1, marginRight: 1 }}>R$</Text>
                      <Text style={{ fontSize: 24, fontWeight: 'bold', color: centerTextColor }}>{totalGastoString[0]}</Text>
                      <Text style={{ fontSize: 12, color: centerTextColor, marginTop: 4 }}>,{totalGastoString[1]}</Text>
                    </View>
                  </View>
                );
              }}
            />
          )}
        </View>

        {dadosGraficoPizzaGifted.length > 0 && (
          <View style={{ backgroundColor: colors.card, borderRadius: 20, padding: 16, elevation: 2, marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.text, marginBottom: 12 }}>Detalhamento por Tabela</Text>
            {dadosGraficoPizzaGifted.map((item, index) => {
              const porcentagem = totalDespesas > 0 ? ((item.value / totalDespesas) * 100).toFixed(1) : '0';

              return (
                <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: isDarkMode ? '#374151' : '#f3f4f6' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, marginRight: 10, backgroundColor: item.color }} />
                    <Text style={{ fontSize: 13, color: colors.text, fontWeight: '500' }}>{item.label}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 11, color: colors.subText, marginBottom: 2 }}>{porcentagem}%</Text>
                    <Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.text }}>R$ {item.value.toFixed(2)}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* 👇 A MÁGICA 3: O NOVO GRÁFICO DE ÁREA FLUIDA */}
        <View style={{ backgroundColor: colors.card, borderRadius: 20, padding: 16, marginBottom: 20, elevation: 2 }}>
          <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.text, textAlign: 'center', marginBottom: 2 }}>Tendência e Previsão</Text>
          <Text style={{ fontSize: 12, color: colors.subText, textAlign: 'center', marginBottom: 20 }}>Evolução dos seus gastos</Text>
          
          {temDadosEvolucao ? (
            <ScrollView horizontal ref={scrollGraficoRef} showsHorizontalScrollIndicator={false}
              onContentSizeChange={() => {
                const meioDoGrafico = (larguraTotalBarras - cardWidth) / 2;
                scrollGraficoRef.current?.scrollTo({ x: meioDoGrafico, animated: false });
              }}
            >
              <View style={{ paddingHorizontal: 16, paddingTop: 30 }}>
                <LineChart
                  data={dadosEvolucaoPremiumLine}
                  height={260}
                  overflowTop={24}
                  overflowBottom={8}
                  areaChart // 👈 MÁGICA: Transforma em gráfico de área
                  curved={false} // Linhas retas
                  initialSpacing={20}
                  spacing={70}
                  thickness={3}
                  // 👇 Cores adaptáveis (Mint ou Azul)
                  color1={colors.accent}
                  startFillColor1={colors.accent}
                  endFillColor1={colors.accent}
                  startOpacity={0.15}
                  endOpacity={0.01}
                  hideRules // 👇 Remove linhas de grade feias
                  xAxisColor={isDarkMode ? '#374151' : '#e2e8f0'}
                  yAxisThickness={0}
                  //👇 Labels e Pontos no topo
                  textColor1={colors.text}
                  dataPointsColor={colors.accent}
                  dataPointsRadius={4}
                  textShiftY={-8}
                  textShiftX={-10}
                  textFontSize={10}
                  showValuesAsDataPointsText
                  hideYAxisText // Deixa o visual mais clean
                  disableScroll={true} // Gerido pelo ScrollView externo
                  xAxisLabelTextStyle={{ color: colors.subText, fontSize: 10, marginTop: 10 }}
                />
              </View>
            </ScrollView>
          ) : (
            <View style={{ padding: 24, justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="trending-down" size={36} color={colors.subText} />
              <Text style={{ color: colors.subText, marginTop: 10, textAlign: 'center' }}>Sem histórico de despesas para exibir a tendência.</Text>
            </View>
          )}
          <Text style={{ fontSize: 11, color: colors.subText, marginTop: 15, textAlign: 'center', fontStyle: 'italic', paddingHorizontal: 10 }}>Deslize para ver o passado ou previsões.</Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, 
  compactHeader: { flexDirection: 'row', padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 50, borderBottomWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center' }, 
});