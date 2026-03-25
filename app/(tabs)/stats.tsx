// app/(tabs)/stats.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit'; // 👈 Usamos o Chart-Kit para a Pizza
import { BarChart } from 'react-native-gifted-charts'; // 👈 NOVA: Usamos a Gifted Charts para as Barras!
import { useAccounts } from '../../hooks/useAccounts';
import { useTransactions } from '../../hooks/useTransactions';

const screenWidth = Dimensions.get('window').width;
const cardWidth = screenWidth - 40; 
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const CORES = ['#3b82f6', '#f59e0b', '#8b5cf6', '#f43f5e', '#0ea5e9', '#d946ef', '#14b8a6', '#f97316', '#6366f1', '#64748b'];

export default function StatsScreen() {
  const { transacoes, loading: loadingTx } = useTransactions();
  const { contas, loadingContas } = useAccounts();
  const scrollGraficoRef = useRef<ScrollView>(null);

  const [dataFiltro, setDataFiltro] = useState(new Date());
  const mesAtual = dataFiltro.getMonth();
  const anoAtual = dataFiltro.getFullYear();
  const mesFormatado = `${MESES[mesAtual]} ${anoAtual}`;

  const irMesAnterior = () => setDataFiltro(new Date(anoAtual, mesAtual - 1, 1));
  const irProximoMes = () => setDataFiltro(new Date(anoAtual, mesAtual + 1, 1));

  // --- LÓGICA 1: PIZZA (MÊS SELECIONADO) ---
  let totalReceita = 0;
  let totalDespesas = 0;
  let totalTerceirosCard = 0; 
  const despesasPorTabela: Record<string, number> = {};

  transacoes.forEach(t => {
    const dataPag = new Date(t.paymentDate || t.date);
    const pertenceAoMes = dataPag.getMonth() === mesAtual && dataPag.getFullYear() === anoAtual;
    if (!pertenceAoMes) return;

    const conta = contas.find(c => c.nome === t.accountId);
    const isTerceiro = (conta && conta.tipo === 'TERCEIROS') || t.isForThirdParty;

    if (isTerceiro) {
      if (t.type === 'DESPESA') totalTerceirosCard += t.amount;
      return; 
    }

    if (t.type === 'RECEITA') {
      totalReceita += t.amount;
    } else if (t.type === 'DESPESA') {
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
      return { name: nomeTabela, valor, color: cor, legendFontColor: '#374151', legendFontSize: 12 };
    });

  const saldoRestante = totalReceita - totalDespesas;
  if (saldoRestante > 0) {
    dadosGraficoPizza.push({ name: 'Disponível', valor: saldoRestante, color: '#d1fae5', legendFontColor: '#10b981', legendFontSize: 12 });
  }

  // --- LÓGICA 2: GRÁFICO DE BARRAS PREMIUM (Gifted Charts) ---
  const offsetsMeses = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5]; 
  const hoje = new Date();

  const dadosEvolucaoPremium = offsetsMeses.map(offset => {
    const dataRef = new Date(hoje.getFullYear(), hoje.getMonth() + offset, 1);
    const labelMes = MESES[dataRef.getMonth()].substring(0, 3);
    const labelAno = String(dataRef.getFullYear()).substring(2);

    let totalGastoNoMes = 0;
    transacoes.forEach(t => {
      const d = new Date(t.paymentDate || t.date);
      if (d.getMonth() === dataRef.getMonth() && d.getFullYear() === dataRef.getFullYear()) {
        const conta = contas.find(c => c.nome === t.accountId);
        const isTerceiro = (conta && conta.tipo === 'TERCEIROS') || t.isForThirdParty;
        if (t.type === 'DESPESA' && !isTerceiro) {
          totalGastoNoMes += t.amount;
        }
      }
    });

    const isMesAtual = offset === 0; // Verifica se é o mês exato em que estamos hoje
    const valorArredondado = Math.round(totalGastoNoMes);

    return {
      value: valorArredondado,
      label: `${labelMes}/${labelAno}`,
      // Se for o mês atual, a barra fica Laranja/Âmbar. Se não, fica Azul.
      frontColor: isMesAtual ? '#f59e0b' : '#3b82f6', 
      // O valor flutuando no topo da barra
      topLabelComponent: () => (
        <Text style={{ color: isMesAtual ? '#f59e0b' : '#6b7280', fontSize: 10, fontWeight: 'bold', marginBottom: 4 }}>
          {valorArredondado}
        </Text>
      )
    };
  });

  // Calculamos a largura total que as 11 barras vão ocupar para o ScrollView arrastar certinho
  const larguraTotalBarras = offsetsMeses.length * 60; 

  if (loadingTx || loadingContas) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Estatísticas</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.monthSelectorContainer}>
          <TouchableOpacity onPress={irMesAnterior} style={styles.monthBtn}>
            <Ionicons name="chevron-back" size={24} color="#3b82f6" />
          </TouchableOpacity>
          <Text style={styles.monthText}>{mesFormatado}</Text>
          <TouchableOpacity onPress={irProximoMes} style={styles.monthBtn}>
            <Ionicons name="chevron-forward" size={24} color="#3b82f6" />
          </TouchableOpacity>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Receita do Mês</Text>
            <Text style={[styles.summaryValue, { color: '#10b981' }]}>R$ {totalReceita.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Seus Gastos</Text>
            <Text style={[styles.summaryValue, { color: '#ef4444' }]}>R$ {totalDespesas.toFixed(2)}</Text>
          </View>
        </View>

        {totalTerceirosCard > 0 && (
          <View style={[styles.summaryCard, { marginBottom: 20, backgroundColor: '#fdf2f8' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={[styles.summaryLabel, { color: '#be185d' }]}>A Receber (Terceiros)</Text>
                <Text style={[styles.summaryValue, { color: '#be185d', fontSize: 18 }]}>R$ {totalTerceirosCard.toFixed(2)}</Text>
              </View>
              <Ionicons name="people-outline" size={24} color="#be185d" />
            </View>
          </View>
        )}

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Destino da sua Receita</Text>
          
          {totalReceita === 0 && totalDespesas === 0 ? (
            <View style={styles.emptyChart}>
              <Ionicons name="pie-chart-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyChartText}>Nenhuma transação neste mês.</Text>
            </View>
          ) : (
            <PieChart
              data={dadosGraficoPizza}
              width={cardWidth} 
              height={220}
              chartConfig={{ color: () => `rgba(0, 0, 0, 1)` }}
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
          <View style={[styles.detailsCard, { marginBottom: 20 }]}>
            <Text style={styles.chartTitleLeft}>Detalhamento por Tabela</Text>
            {dadosGraficoPizza.map((item, index) => {
              const totalPizza = saldoRestante > 0 ? totalReceita : totalDespesas;
              const porcentagem = totalPizza > 0 ? ((item.valor / totalPizza) * 100).toFixed(1) : '0';

              return (
                <View key={index} style={styles.detailRow}>
                  <View style={styles.detailLeft}>
                    <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                    <Text style={[styles.detailName, item.name === 'Disponível' && { color: '#10b981', fontWeight: 'bold' }]}>
                      {item.name}
                    </Text>
                  </View>
                  <View style={styles.detailRight}>
                    <Text style={styles.detailPercent}>{porcentagem}%</Text>
                    <Text style={styles.detailValue}>R$ {item.valor.toFixed(2)}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* 👇 GRÁFICO 2: O NOVO GRÁFICO PREMIUM ANIMADO */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Evolução de Gastos e Previsões</Text>
          
          <ScrollView 
            horizontal 
            ref={scrollGraficoRef}
            showsHorizontalScrollIndicator={false}
            onContentSizeChange={() => {
              // Arrasta a barra automaticamente para o centro assim que o gráfico carregar
              const meioDoGrafico = (larguraTotalBarras - cardWidth) / 2;
              scrollGraficoRef.current?.scrollTo({ x: meioDoGrafico, animated: false });
            }}
          >
            {/* Margem interna para o gráfico não encostar nas bordas quando arrastado */}
            <View style={{ paddingHorizontal: 16, paddingTop: 20 }}> 
              <BarChart
                data={dadosEvolucaoPremium}
                barWidth={28}
                spacing={32}
                roundedTop // 👈 Deixa as barras "fofinhas"
                roundedBottom={false}
                hideRules // 👈 Remove as linhas de fundo feias
                xAxisThickness={1}
                yAxisThickness={0}
                xAxisColor={'#e5e7eb'}
                yAxisTextStyle={{ color: '#9ca3af', fontSize: 10 }}
                xAxisLabelTextStyle={{ color: '#6b7280', fontSize: 11 }}
                isAnimated // 👈 A mágica da animação!
                animationDuration={800}
                disableScroll={true} // O ScrollView que gerencia o arraste agora
              />
            </View>
          </ScrollView>

          <Text style={styles.trendHelper}>Deslize para ver o passado ou suas previsões futuras.</Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 50, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  monthSelectorContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: 8, borderRadius: 16, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4 },
  monthBtn: { padding: 8 },
  monthText: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', minWidth: 120, textAlign: 'center' },

  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  summaryCard: { flex: 1, backgroundColor: '#ffffff', padding: 16, borderRadius: 16, elevation: 1 },
  summaryLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  summaryValue: { fontSize: 20, fontWeight: 'bold' },

  chartCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 20, marginBottom: 20, alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6 },
  chartTitle: { fontSize: 16, fontWeight: 'bold', color: '#374151', textAlign: 'center', marginBottom: 16, width: '100%' }, 
  chartTitleLeft: { fontSize: 16, fontWeight: 'bold', color: '#374151', alignSelf: 'flex-start', marginBottom: 16 }, 
  trendHelper: { fontSize: 11, color: '#9ca3af', marginTop: 15, textAlign: 'center', fontStyle: 'italic', paddingHorizontal: 10 },
  
  emptyChart: { height: 200, justifyContent: 'center', alignItems: 'center' },
  emptyChartText: { color: '#9ca3af', marginTop: 12 },

  detailsCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 20, elevation: 2 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  detailLeft: { flexDirection: 'row', alignItems: 'center' },
  colorDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  detailName: { fontSize: 14, color: '#4b5563', fontWeight: '500' },
  detailRight: { alignItems: 'flex-end' },
  detailPercent: { fontSize: 12, color: '#9ca3af', marginBottom: 2 },
  detailValue: { fontSize: 14, fontWeight: 'bold', color: '#1f2937' },
});