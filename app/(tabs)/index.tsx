// app/(tabs)/index.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useAccounts } from '../../hooks/useAccounts';
import { useTheme } from '../../hooks/useTheme';
import { useTransactions } from '../../hooks/useTransactions';
import { deletarTransacaoDoFirebase } from '../../services/firebase/firestore';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function DashboardScreen() {
  const { transacoes, loading: loadingTransacoes } = useTransactions();
  const { contas, loadingContas } = useAccounts();
  const { colors, isDarkMode } = useTheme(); 

  const [dataFiltro, setDataFiltro] = useState(new Date());
  const mesAtual = dataFiltro.getMonth();
  const anoAtual = dataFiltro.getFullYear();
  const mesFormatado = `${MESES[mesAtual]} ${anoAtual}`;

  const irMesAnterior = () => setDataFiltro(new Date(anoAtual, mesAtual - 1, 1));
  const irProximoMes = () => setDataFiltro(new Date(anoAtual, mesAtual + 1, 1));

  let totalDespesasConjuntas = 0;
  let suaParteConjunta = 0;
  let parteRayConjunta = 0;
  let seusGastosIndividuais = 0;
  let aReceberTerceiros = 0;
  let suaReceitaTotal = 0;

  transacoes.forEach((t) => {
    const dataPag = new Date(t.paymentDate || t.date);
    if (dataPag.getMonth() !== mesAtual || dataPag.getFullYear() !== anoAtual) return;
    if (t.type === 'RECEITA') { suaReceitaTotal += t.amount; return; } 
    if (t.isForThirdParty) { aReceberTerceiros += t.amount; return; }

    const conta = contas.find((c) => c.nome === t.accountId);
    if (conta) {
      if (conta.tipo === 'TERCEIROS') aReceberTerceiros += t.amount;
      else if (conta.tipo === 'COMUM') {
        totalDespesasConjuntas += t.amount;
        suaParteConjunta += t.amount * (conta.splitRule.me / 100);
        parteRayConjunta += t.amount * (conta.splitRule.spouse / 100);
      } else if (conta.tipo === 'INDIVIDUAL' && conta.dono === 'EU') {
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
        transacoesRecentes.push({ ...t, descricao: `${t.descricao} (${t.fixedDetails.current}/${t.fixedDetails.total})`, dateParaExibir: t.purchaseDate || t.date });
      }
    } else transacoesRecentes.push({ ...t, dateParaExibir: t.purchaseDate || t.date });
  });

  transacoesRecentes.sort((a, b) => new Date(b.dateParaExibir).getTime() - new Date(a.dateParaExibir).getTime());
  const ultimasTransacoes = transacoesRecentes.slice(0, 15);
  const formatarDataHora = (dataIso: string) => {
    if (!dataIso) return '';
    const data = new Date(dataIso);
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' às ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  if (loadingTransacoes || loadingContas) return <View style={[{ flex: 1, justifyContent: 'center', alignItems: 'center' }, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.accent} /><Text style={{ marginTop: 10, color: colors.subText, fontSize: 12 }}>Calculando finanças...</Text></View>;

  return (
    <View style={[{ flex: 1 }, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 40 }}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.text }}>Olá!</Text>
            <Text style={{ fontSize: 13, color: colors.subText, marginTop: 2 }}>Resumo de {MESES[mesAtual]}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, paddingHorizontal: 6, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: isDarkMode ? '#334155' : '#e2e8f0' }}>
            <TouchableOpacity onPress={irMesAnterior} style={{ padding: 4 }}><Ionicons name="chevron-back" size={16} color={colors.accent} /></TouchableOpacity>
            <Text style={{ fontSize: 13, color: colors.accent, fontWeight: 'bold', marginHorizontal: 2, width: 85, textAlign: 'center' }}>{mesFormatado}</Text>
            <TouchableOpacity onPress={irProximoMes} style={{ padding: 4 }}><Ionicons name="chevron-forward" size={16} color={colors.accent} /></TouchableOpacity>
          </View>
        </View>

        {/* 👇 AQUI: Gradient conectado ao tema e bordas reduzidas para 16 */}
        <LinearGradient 
          colors={colors.gradient as [string, string]} 
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} 
          style={{ borderRadius: 16, padding: 20, marginBottom: 16, elevation: 4 }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}><Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600' }}>Previsão de Saldo do Mês</Text><Ionicons name="wallet-outline" size={18} color="rgba(255,255,255,0.7)" /></View>
          <Text style={{ fontSize: 30, fontWeight: 'bold', color: '#ffffff', marginBottom: 12 }}>R$ {seuSaldoRestante.toFixed(2)}</Text>
          <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, marginBottom: 6 }}><View style={[{ height: 6, backgroundColor: '#ffffff', borderRadius: 3 }, { width: `${Math.min(porcentagemGasta, 100)}%` }]} /></View>
          <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 16 }}>Comprometido: {porcentagemGasta.toFixed(0)}% da receita.</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)', paddingTop: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Ionicons name="arrow-up-circle" size={16} color="#6ee7b7" /><View><Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>Receitas</Text><Text style={{ fontSize: 14, fontWeight: 'bold', color: '#ffffff' }}>R$ {suaReceitaTotal.toFixed(2)}</Text></View></View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Ionicons name="arrow-down-circle" size={16} color="#fca5a5" /><View><Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>Despesas</Text><Text style={{ fontSize: 14, fontWeight: 'bold', color: '#ffffff' }}>R$ {suasDespesasTotais.toFixed(2)}</Text></View></View>
          </View>
        </LinearGradient>

        <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, elevation: 1, marginBottom: 12 }}>
          <Text style={{ fontSize: 12, color: colors.subText, marginBottom: 4 }}>Despesas Conjuntas</Text>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 16 }}>R$ {totalDespesasConjuntas.toFixed(2)}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc', borderRadius: 10, padding: 12 }}>
            <View style={{ flex: 1 }}><Text style={{ fontSize: 11, color: colors.subText, marginBottom: 2 }}>Sua Parte</Text><Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>R$ {suaParteConjunta.toFixed(2)}</Text></View>
            <View style={{ width: 1, backgroundColor: isDarkMode ? '#334155' : '#e2e8f0', marginHorizontal: 12 }} />
            <View style={{ flex: 1 }}><Text style={{ fontSize: 11, color: colors.subText, marginBottom: 2 }}>Parte Ray</Text><Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>R$ {parteRayConjunta.toFixed(2)}</Text></View>
          </View>
        </View>

        <View style={{ flexDirection: 'row', marginBottom: 20 }}>
          <View style={{ flex: 1, borderRadius: 12, padding: 12, backgroundColor: isDarkMode ? '#4c1d95' : '#fdf2f8', marginRight: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}><Text style={{ fontSize: 11, color: isDarkMode ? '#f9a8d4' : '#6b7280' }}>A Receber</Text><Ionicons name="people-outline" size={14} color={isDarkMode ? '#fbcfe8' : '#be185d'} /></View>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: isDarkMode ? '#fbcfe8' : '#be185d' }}>R$ {aReceberTerceiros.toFixed(2)}</Text>
          </View>
          <View style={{ flex: 1, borderRadius: 12, padding: 12, backgroundColor: isDarkMode ? '#1e3a8a' : '#f0f9ff' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}><Text style={{ fontSize: 11, color: isDarkMode ? '#bfdbfe' : '#6b7280' }}>Individual</Text><Ionicons name="person-outline" size={14} color={isDarkMode ? '#bfdbfe' : '#0369a1'} /></View>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: isDarkMode ? '#bfdbfe' : '#0369a1' }}>R$ {seusGastosIndividuais.toFixed(2)}</Text>
          </View>
        </View>

        <View>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 12, marginLeft: 4 }}>Recentes</Text>
          {ultimasTransacoes.length === 0 ? (
            <Text style={{ color: colors.subText, textAlign: 'center', marginTop: 10, fontSize: 13 }}>Nenhuma transação registrada.</Text>
          ) : (
            ultimasTransacoes.map((item: any) => (
              <TouchableOpacity key={item.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, padding: 12, borderRadius: 12, marginBottom: 8 }} activeOpacity={0.7} onLongPress={() => deletarTransacaoDoFirebase(item.id)}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: item.type === 'RECEITA' ? (isDarkMode ? '#064e3b' : '#ecfdf5') : (isDarkMode ? '#1e293b' : '#f1f5f9'), justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                  <Ionicons name={item.type === 'RECEITA' ? "trending-up" : "cart-outline"} size={20} color={item.type === 'RECEITA' ? "#10b981" : colors.subText} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 2 }} numberOfLines={1}>{item.descricao}</Text>
                  <Text style={{ fontSize: 11, color: colors.subText }}>{item.accountId}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 2, color: item.type === 'RECEITA' ? '#10b981' : colors.text }}>{item.type === 'RECEITA' ? '+' : ''}R$ {item.amount.toFixed(2)}</Text>
                  <Text style={{ fontSize: 10, color: colors.subText }}>{formatarDataHora(item.dateParaExibir)}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
      
      <TouchableOpacity style={{ position: 'absolute', bottom: 80, right: 20, width: 52, height: 52, borderRadius: 26, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center', shadowColor: colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 5, zIndex: 10 }} activeOpacity={0.8} onPress={() => router.push('/add-transaction')}>
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}