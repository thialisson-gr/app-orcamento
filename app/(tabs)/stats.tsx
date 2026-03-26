// app/(tabs)/stats.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { BarChart } from 'react-native-gifted-charts';
import { useAccounts } from '../../hooks/useAccounts';
import { useTheme } from '../../hooks/useTheme'; // 👈 TEMA AQUI
import { useTransactions } from '../../hooks/useTransactions';

const screenWidth = Dimensions.get('window').width;
const cardWidth = screenWidth - 40; 
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const CORES = ['#3b82f6', '#f59e0b', '#8b5cf6', '#f43f5e', '#0ea5e9', '#d946ef', '#14b8a6', '#f97316', '#6366f1', '#64748b'];

export default function StatsScreen() {
  const { transacoes, loading: loadingTx } = useTransactions();
  const { contas, loadingContas } = useAccounts();
  const { colors, isDarkMode } = useTheme(); // 👈 Puxando as cores globais
  const scrollGraficoRef = useRef<ScrollView>(null);

  const [dataFiltro, setDataFiltro] = useState(new Date());
  const mesAtual = dataFiltro.getMonth();
  const anoAtual = dataFiltro.getFullYear();
  const mesFormatado = `${MESES[mesAtual]} ${anoAtual}`;

  const irMesAnterior = () => setDataFiltro(new Date(anoAtual, mesAtual - 1, 1));
  const irProximoMes = () => setDataFiltro(new Date(anoAtual, mesAtual + 1, 1));

  let totalReceita = 0;
  let totalDespesas = 0;
  let totalTerceirosCard = 0; 
  const despesasPorTabela: Record<string, number> = {};

  transacoes.forEach(t => {
    const dataPag = new Date(t.paymentDate || t.date);
    if (dataPag.getMonth() !== mesAtual || dataPag.getFullYear() !== anoAtual) return;

    const conta = contas.find(c => c.nome === t.accountId);
    const isTerceiro = (conta && conta.tipo === 'TERCEIROS') || t.isForThirdParty;

    if (isTerceiro) {
      if (t.type === 'DESPESA') totalTerceirosCard += t.amount;
      return; 
    }

    if (t.type === 'RECEITA') totalReceita += t.amount;
    else if (t.type === 'DESPESA') {
      totalDespesas += t.amount;
      if (!despesasPorTabela[t.accountId]) despesasPorTabela[t.accountId] = 0;
      despesasPorTabela[t.accountId] += t.amount;
    }
  });

  let colorIndex = 0;
  const dadosGraficoPizza = Object.keys(despesasPorTabela)
    .sort((a, b) => despesasPorTabela[b] - despesasPorTabela[a])
    .map((nomeTabela) => {
      const valor = despesasPorTabela[nomeTabela];
      const cor = CORES[colorIndex % CORES.length];
      colorIndex++;
      return { name: nomeTabela, valor, color: cor };
    });

  const saldoRestante = totalReceita - totalDespesas;
  if (saldoRestante > 0) {
    // 👇 O Verde do Saldo muda sutilmente dependendo do tema!
    dadosGraficoPizza.push({ name: 'Disponível', valor: saldoRestante, color: isDarkMode ? '#064e3b' : '#d1fae5' }); 
  }

  const offsetsMeses = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5]; 
  const hoje = new Date();

  const dadosEvolucaoPremium = offsetsMeses.map(offset => {
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
      frontColor: isMesAtual ? '#f59e0b' : colors.accent, 
      topLabelComponent: () => (
        <Text style={{ color: isMesAtual ? '#f59e0b' : colors.subText, fontSize: 10, fontWeight: 'bold', marginBottom: 4 }}>
          {valorArredondado}
        </Text>
      )
    };
  });

  const larguraTotalBarras = offsetsMeses.length * 60; 

  if (loadingTx || loadingContas) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}><ActivityIndicator size="large" color={colors.accent} /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 50, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: isDarkMode ? '#374151' : '#e5e7eb' }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text }}>Estatísticas</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.card, padding: 12, borderRadius: 16, marginBottom: 20, elevation: 2 }}>
          <TouchableOpacity onPress={irMesAnterior} style={{ padding: 8, backgroundColor: colors.accentLight, borderRadius: 8 }}><Ionicons name="chevron-back" size={20} color={colors.accent} /></TouchableOpacity>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>{mesFormatado}</Text>
          <TouchableOpacity onPress={irProximoMes} style={{ padding: 8, backgroundColor: colors.accentLight, borderRadius: 8 }}><Ionicons name="chevron-forward" size={20} color={colors.accent} /></TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          <View style={{ flex: 1, backgroundColor: colors.card, padding: 16, borderRadius: 16, elevation: 1 }}>
            <Text style={{ fontSize: 12, color: colors.subText, marginBottom: 4 }}>Receita do Mês</Text>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#10b981' }}>R$ {totalReceita.toFixed(2)}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.card, padding: 16, borderRadius: 16, elevation: 1 }}>
            <Text style={{ fontSize: 12, color: colors.subText, marginBottom: 4 }}>Seus Gastos</Text>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#ef4444' }}>R$ {totalDespesas.toFixed(2)}</Text>
          </View>
        </View>

        {totalTerceirosCard > 0 && (
          <View style={{ backgroundColor: isDarkMode ? '#4c1d95' : '#fdf2f8', padding: 16, borderRadius: 16, marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ fontSize: 12, color: isDarkMode ? '#f9a8d4' : '#be185d', marginBottom: 4 }}>A Receber (Terceiros)</Text>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: isDarkMode ? '#fbcfe8' : '#be185d' }}>R$ {totalTerceirosCard.toFixed(2)}</Text>
              </View>
              <Ionicons name="people-outline" size={24} color={isDarkMode ? '#fbcfe8' : '#be185d'} />
            </View>
          </View>
        )}

        <View style={{ backgroundColor: colors.card, borderRadius: 20, padding: 20, marginBottom: 20, alignItems: 'center', elevation: 2 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text, textAlign: 'center', marginBottom: 16, width: '100%' }}>Destino da sua Receita</Text>
          {totalReceita === 0 && totalDespesas === 0 ? (
            <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="pie-chart-outline" size={48} color={colors.subText} />
              <Text style={{ color: colors.subText, marginTop: 12 }}>Nenhuma transação neste mês.</Text>
            </View>
          ) : (
            <PieChart
              data={dadosGraficoPizza}
              width={cardWidth} 
              height={220}
              chartConfig={{ color: () => isDarkMode ? '#ffffff' : '#000000' }}
              accessor={"valor"}
              backgroundColor={"transparent"}
              paddingLeft={"0"}
              center={[cardWidth / 4, 0]} 
              absolute 
              hasLegend={false}
            />
          )}
        </View>

        {dadosGraficoPizza.length > 0 && (
          <View style={{ backgroundColor: colors.card, borderRadius: 20, padding: 20, elevation: 2, marginBottom: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 16 }}>Detalhamento por Tabela</Text>
            {dadosGraficoPizza.map((item, index) => {
              const totalPizza = saldoRestante > 0 ? totalReceita : totalDespesas;
              const porcentagem = totalPizza > 0 ? ((item.valor / totalPizza) * 100).toFixed(1) : '0';

              return (
                <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: isDarkMode ? '#374151' : '#f3f4f6' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 12, height: 12, borderRadius: 6, marginRight: 12, backgroundColor: item.color }} />
                    <Text style={[{ fontSize: 14, color: colors.text, fontWeight: '500' }, item.name === 'Disponível' && { color: '#10b981', fontWeight: 'bold' }]}>{item.name}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 12, color: colors.subText, marginBottom: 2 }}>{porcentagem}%</Text>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.text }}>R$ {item.valor.toFixed(2)}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ backgroundColor: colors.card, borderRadius: 20, padding: 20, marginBottom: 20, elevation: 2 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text, textAlign: 'center', marginBottom: 16 }}>Evolução de Gastos e Previsões</Text>
          <ScrollView 
            horizontal 
            ref={scrollGraficoRef}
            showsHorizontalScrollIndicator={false}
            onContentSizeChange={() => {
              const meioDoGrafico = (larguraTotalBarras - cardWidth) / 2;
              scrollGraficoRef.current?.scrollTo({ x: meioDoGrafico, animated: false });
            }}
          >
            <View style={{ paddingHorizontal: 16, paddingTop: 20 }}> 
              <BarChart
                data={dadosEvolucaoPremium}
                barWidth={28}
                spacing={32}
                roundedTop 
                hideRules 
                xAxisThickness={1}
                yAxisThickness={0}
                xAxisColor={isDarkMode ? '#374151' : '#e5e7eb'} // 👈 Linha do gráfico muda de cor no escuro
                yAxisTextStyle={{ color: colors.subText, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: colors.subText, fontSize: 11 }}
                isAnimated 
                animationDuration={800}
                disableScroll={true}
              />
            </View>
          </ScrollView>
          <Text style={{ fontSize: 11, color: colors.subText, marginTop: 15, textAlign: 'center', fontStyle: 'italic', paddingHorizontal: 10 }}>Deslize para ver o passado ou suas previsões futuras.</Text>
        </View>

      </ScrollView>
    </View>
  );
}