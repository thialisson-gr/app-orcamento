// app/(tabs)/stats.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, LayoutAnimation, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LineChart, PieChart } from 'react-native-gifted-charts';
import { useAccounts } from '../../hooks/useAccounts';
import { useIdentity } from '../../hooks/useIdentity'; // 👈 Identidade importada!
import { useTheme } from '../../hooks/useTheme';
import { useTransactions } from '../../hooks/useTransactions';

const screenWidth = Dimensions.get('window').width;
const cardWidth = screenWidth - 32; 
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const CORES = ['#00d09c', '#3b82f6', '#f59e0b', '#8b5cf6', '#f43f5e', '#0ea5e9', '#d946ef', '#14b8a6', '#f97316'];

const formatarMoeda = (valor: number) => {
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function StatsScreen() {
  const { transacoes, loading: loadingTx } = useTransactions();
  const { contas, loadingContas } = useAccounts();
  const { colors, isDarkMode } = useTheme(); 
  const { perfil } = useIdentity(); // 👈 Quem está olhando o gráfico?
  const scrollGraficoRef = useRef<ScrollView>(null);

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

  // --- LÓGICA 1: SOMAS (APENAS SUA PARTE) ---
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
        // 👈 INVERSÃO INTELIGENTE AQUI
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

  // --- LÓGICA 2: GRÁFICO DE ÁREA PREMIUM (APENAS SUA PARTE) ---
  const offsetsMeses = [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const hoje = new Date();

  const dadosEvolucaoPremiumLine = useMemo(() => {
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
              // 👈 INVERSÃO INTELIGENTE AQUI TAMBÉM
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

  const larguraTotalBarras = offsetsMeses.length * 85; 
  const temDadosEvolucao = dadosEvolucaoPremiumLine.some(item => item.value > 0);

  // --- LÓGICA 3: O CARTÃO BALANÇO (APENAS SUA PARTE MATEMÁTICA) ---
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
        // 👈 INVERSÃO INTELIGENTE AQUI TAMBÉM
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
      <View style={[styles.compactHeader, { backgroundColor: colors.card, borderBottomColor: isDarkMode ? '#374151' : '#e5e7eb' }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Estatísticas</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.card, padding: 2, borderRadius: 8, marginBottom: 16, elevation: 1, borderWidth: isDarkMode ? 1 : 0, borderColor: '#334155' }}>
          <TouchableOpacity onPress={irMesAnterior} style={{ padding: 8, backgroundColor: colors.accentLight, borderRadius: 6 }}><Ionicons name="chevron-back" size={16} color={colors.accent} /></TouchableOpacity>
          <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.text }}>{mesFormatado}</Text>
          <TouchableOpacity onPress={irProximoMes} style={{ padding: 8, backgroundColor: colors.accentLight, borderRadius: 6 }}><Ionicons name="chevron-forward" size={16} color={colors.accent} /></TouchableOpacity>
        </View>

        {totalTerceirosCard > 0 && (
          <View style={{ backgroundColor: isDarkMode ? '#4c1d95' : '#fdf2f8', padding: 12, borderRadius: 8, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ fontSize: 11, color: isDarkMode ? '#f9a8d4' : '#be185d', marginBottom: 2 }}>A Receber (Terceiros)</Text>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: isDarkMode ? '#fbcfe8' : '#be185d' }}>R$ {totalTerceirosCard.toFixed(2)}</Text>
              </View>
              <Ionicons name="people-outline" size={20} color={isDarkMode ? '#fbcfe8' : '#be185d'} />
            </View>
          </View>
        )}

        {/* ROSCA (DONUT) DO MÊS */}
        <View style={{ backgroundColor: colors.card, borderRadius: 10, padding: 20, marginBottom: 16, alignItems: 'center', elevation: 2, borderColor: isDarkMode ? '#334155' : 'transparent', borderWidth: isDarkMode ? 1 : 0 }}>
          <Text style={{ textAlign: 'center',fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 16, width: '100%' }}>Suas Despesas</Text>
          
          {totalDespesas === 0 ? (
            <View style={{ height: 180, justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="pie-chart-outline" size={48} color={colors.subText} />
              <Text style={{ color: colors.subText, marginTop: 12, fontSize: 13 }}>Nenhuma transação.</Text>
            </View>
          ) : (
            <PieChart
              data={dadosGraficoPizzaGifted}
              donut 
              radius={120} 
              innerRadius={95} 
              isAnimated
              animationDuration={800}
              inwardExtraLengthForFocused={8}
              innerCircleBorderWidth={1}
              innerCircleBorderColor={isDarkMode ? '#374151' : '#f9f6f1'}
              centerLabelComponent={() => {
                const centerTextColor = isDarkMode ? '#f8fafc' : '#1f2937';
                const centerSubtitleColor = isDarkMode ? '#94a3b8' : '#6b7280';
                return (
                  <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 15, color: centerSubtitleColor, marginBottom: 2 }}>Você Gasta</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                      <Text style={{ fontSize: 32, fontWeight: 'bold', color: centerTextColor, marginTop: 1, marginRight: 1 }}>R$ </Text>
                      <Text style={{ fontSize: 32, fontWeight: 'bold', color: centerTextColor }}>{totalGastoString[0]}</Text>
                      <Text style={{ fontSize: 16, color: centerTextColor, marginTop: 6 }}>,{totalGastoString[1]}</Text>
                    </View>
                  </View>
                );
              }}
            />
          )}
        </View>

        {/* A LEGENDA DA ROSCA */}
        {dadosGraficoPizzaGifted.length > 0 && (
          <View style={{ backgroundColor: colors.card, borderRadius: 10, padding: 20, elevation: 2, marginBottom: 20, borderColor: isDarkMode ? '#334155' : 'transparent', borderWidth: isDarkMode ? 1 : 0 }}>
            {dadosGraficoPizzaGifted.map((item, index) => {
              const porcentagem = totalDespesas > 0 ? ((item.value / totalDespesas) * 100).toFixed(1) : '0';
              const isLast = index === dadosGraficoPizzaGifted.length - 1;

              return (
                <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: isLast ? 0 : 1, borderBottomColor: isDarkMode ? '#334155' : '#f3f4f6' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 12, height: 12, borderRadius: 6, marginRight: 12, backgroundColor: item.color }} />
                    <Text style={{ fontSize: 14, color: colors.text, fontWeight: '500' }}>{item.label}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 11, color: colors.subText, marginBottom: 2 }}>{porcentagem}%</Text>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.text }}>R$ {item.value.toFixed(2)}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* GRÁFICO DE ÁREA PREMIUM */}
        <View style={{ backgroundColor: colors.card, borderRadius: 10, paddingVertical: 8, marginBottom: 20, elevation: 2, borderColor: isDarkMode ? '#334155' : 'transparent', borderWidth: isDarkMode ? 1 : 0 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text, textAlign: 'center', marginBottom: 2 }}>Tendência e Previsão</Text>
          <Text style={{ fontSize: 12, color: colors.subText, textAlign: 'center', marginBottom: 10 }}>Evolução dos seus gastos</Text>
          
          {temDadosEvolucao ? (
            <ScrollView horizontal ref={scrollGraficoRef} showsHorizontalScrollIndicator={false}
              onContentSizeChange={() => {
                const meioDoGrafico = (larguraTotalBarras - cardWidth) / 2;
                scrollGraficoRef.current?.scrollTo({ x: meioDoGrafico, animated: false });
              }}
            >
              <View style={{ zIndex: 0,paddingHorizontal: 16, paddingTop: 60, paddingBottom: 10 }}>
                <LineChart
                  data={dadosEvolucaoPremiumLine}
                  height={140} 
                  overflowTop={100} 
                  overflowBottom={50} 
                  areaChart 
                  curved={false}
                  initialSpacing={20}
                  spacing={80} 
                  thickness={3}
                  color1={colors.accent}
                  startFillColor1={colors.accent}
                  endFillColor1={colors.accent}
                  startOpacity={0.2} 
                  endOpacity={0.0}
                  hideRules 
                  xAxisColor={isDarkMode ? '#334155' : '#e2e8f0'}
                  yAxisThickness={0}
                  hideYAxisText 
                  disableScroll={true}                  
                  xAxisLabelTextStyle={{ color: colors.subText, fontSize: 13}} 
                />
              </View>
            </ScrollView>
          ) : (
            <View style={{ padding: 24, justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="trending-down" size={36} color={colors.subText} />
              <Text style={{ color: colors.subText, marginTop: 10, textAlign: 'center' }}>Sem histórico para exibir a tendência.</Text>
            </View>
          )}
          <Text style={{ fontSize: 11, color: colors.subText, marginTop: 15, textAlign: 'center', fontStyle: 'italic', paddingHorizontal: 10 }}>Deslize para ver o passado ou previsões.</Text>
        </View>

        {/* O CARTÃO DE BALANÇO EXATO */}
        {tabelasBalanco.length > 0 && (
          <View style={{ backgroundColor: colors.card, borderRadius: 10, paddingVertical: 24, paddingHorizontal: 16, elevation: 3, borderColor: isDarkMode ? '#334155' : 'transparent', borderWidth: isDarkMode ? 1 : 0, alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 8 }}>
              <Ionicons name="calculator-outline" size={18} color={colors.subText} />
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.subText, textTransform: 'uppercase', letterSpacing: 1 }}>Seu Fechamento do Mês</Text>
            </View>

            <View style={{ width: '100%', maxWidth: 320 }}>
              {tabelasBalanco.map((tabela) => {
                const isReceita = tabela.tipo === 'RECEITA';
                const corTexto = isReceita ? '#10b981' : '#ef4444'; 
                const sinal = isReceita ? '+' : '-';

                return (
                  <View key={tabela.nome} style={{ flexDirection: 'row', width: '100%', marginBottom: 10, alignItems: 'center' }}>
                    <View style={{ flex: 1.2, flexDirection: 'row', justifyContent: 'flex-end', paddingRight: 16 }}>
                      <Text style={{ fontSize: 18, color: corTexto, marginRight: 8, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
                        {sinal}
                      </Text>
                      <Text style={{ fontSize: 18, fontWeight: '500', color: corTexto, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
                        {formatarMoeda(tabela.valor)}
                      </Text>
                    </View>
                    <View style={{ flex: 1, paddingLeft: 12, borderLeftWidth: 1, borderLeftColor: isDarkMode ? '#334155' : '#f1f5f9', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 15, color: colors.text, fontWeight: '500' }} numberOfLines={1}>{tabela.nome}</Text>
                    </View>
                  </View>
                );
              })}

              <View style={{ height: 2, backgroundColor: isDarkMode ? '#475569' : '#cbd5e1', width: '100%', marginVertical: 16, borderRadius: 2 }} />

              <View style={{ flexDirection: 'row', width: '100%', alignItems: 'center' }}>
                <View style={{ flex: 1.2, flexDirection: 'row', justifyContent: 'flex-end', paddingRight: 16 }}>
                  <Text style={{ fontSize: 24, color: saldoFinalBalanco >= 0 ? '#10b981' : '#ef4444', marginRight: 8, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
                    {saldoFinalBalanco >= 0 ? '+' : '-'}
                  </Text>
                  <Text style={{ fontSize: 24, fontWeight: 'bold', color: saldoFinalBalanco >= 0 ? '#10b981' : '#ef4444', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
                    {formatarMoeda(Math.abs(saldoFinalBalanco))}
                  </Text>
                </View>
                <View style={{ flex: 1, paddingLeft: 12, borderLeftWidth: 1, borderLeftColor: 'transparent', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.subText, textTransform: 'uppercase' }}>Saldo</Text>
                </View>
              </View>

            </View>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }, 
  compactHeader: { flexDirection: 'row', padding: 10, paddingTop: Platform.OS === 'ios' ? 60 : 40, borderBottomWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center' }, 
});