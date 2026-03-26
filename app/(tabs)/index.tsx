// app/(tabs)/index.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useAccounts } from '../../hooks/useAccounts';
import { useTheme } from '../../hooks/useTheme'; // 👈 NOVO IMPORT
import { useTransactions } from '../../hooks/useTransactions';
import { deletarTransacaoDoFirebase } from '../../services/firebase/firestore';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function DashboardScreen() {
  const { transacoes, loading: loadingTransacoes } = useTransactions();
  const { contas, loadingContas } = useAccounts();
  const { colors, isDarkMode } = useTheme(); // 👈 Puxa as cores do tema!

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
        transacoesRecentes.push({ ...t, descricao: `${t.descricao.split(' (')[0]} (Em ${t.installmentDetails.total}x)`, amount: t.amount * t.installmentDetails.total, dateParaExibir: t.purchaseDate || t.date });
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

  if (loadingTransacoes || loadingContas) return <View style={[{ flex: 1, justifyContent: 'center', alignItems: 'center' }, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.accent} /><Text style={{ marginTop: 10, color: colors.subText }}>Calculando finanças...</Text></View>;

  return (
    // 👇 O App inteiro agora reage à cor de background do tema
    <View style={[{ flex: 1 }, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 50 }}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            {/* 👇 Textos reagem à cor de texto do tema */}
            <Text style={{ fontSize: 26, fontWeight: 'bold', color: colors.text }}>Olá!</Text>
            <Text style={{ fontSize: 14, color: colors.subText, marginTop: 2 }}>Aqui está o resumo do mês.</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: isDarkMode ? '#374151' : '#e5e7eb' }}>
            <TouchableOpacity onPress={irMesAnterior} style={{ padding: 4 }}><Ionicons name="chevron-back" size={20} color={colors.accent} /></TouchableOpacity>
            <Text style={{ fontSize: 14, color: colors.accent, fontWeight: 'bold', marginHorizontal: 4, width: 95, textAlign: 'center' }}>{mesFormatado}</Text>
            <TouchableOpacity onPress={irProximoMes} style={{ padding: 4 }}><Ionicons name="chevron-forward" size={20} color={colors.accent} /></TouchableOpacity>
          </View>
        </View>

        {/* O Gradient Principal (Esse não muda, pois já é bonito e contrasta bem) */}
        <LinearGradient colors={['#1e3a8a', '#3b82f6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 24, padding: 24, marginBottom: 20, elevation: 5 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}><Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '600' }}>Previsão de Saldo do Mês</Text><Ionicons name="eye-outline" size={20} color="rgba(255,255,255,0.7)" /></View>
          <Text style={{ fontSize: 36, fontWeight: 'bold', color: '#ffffff', marginBottom: 16 }}>R$ {seuSaldoRestante.toFixed(2)}</Text>
          <View style={{ height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, marginBottom: 8 }}><View style={[{ height: 8, backgroundColor: '#ffffff', borderRadius: 4 }, { width: `${Math.min(porcentagemGasta, 100)}%` }]} /></View>
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 20 }}>Você já comprometeu {porcentagemGasta.toFixed(0)}% da sua receita prevista.</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Ionicons name="arrow-up-circle" size={18} color="#4ade80" /><View><Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Receita Prevista</Text><Text style={{ fontSize: 16, fontWeight: 'bold', color: '#ffffff' }}>R$ {suaReceitaTotal.toFixed(2)}</Text></View></View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Ionicons name="arrow-down-circle" size={18} color="#f87171" /><View><Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Despesas Previstas</Text><Text style={{ fontSize: 16, fontWeight: 'bold', color: '#ffffff' }}>R$ {suasDespesasTotais.toFixed(2)}</Text></View></View>
          </View>
        </LinearGradient>

        {/* 👇 Cards reagem ao tema */}
        <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 20, elevation: 2, marginBottom: 16 }}>
          <Text style={{ fontSize: 14, color: colors.subText, marginBottom: 8 }}>Despesas Conjuntas ({MESES[mesAtual]})</Text>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.text, marginBottom: 20 }}>R$ {totalDespesasConjuntas.toFixed(2)}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: isDarkMode ? '#111827' : '#f9fafb', borderRadius: 12, padding: 16 }}>
            <View style={{ flex: 1 }}><Text style={{ fontSize: 12, color: colors.subText, marginBottom: 4 }}>Sua Parte</Text><Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>R$ {suaParteConjunta.toFixed(2)}</Text></View>
            <View style={{ width: 1, backgroundColor: isDarkMode ? '#374151' : '#e5e7eb', marginHorizontal: 16 }} />
            <View style={{ flex: 1 }}><Text style={{ fontSize: 12, color: colors.subText, marginBottom: 4 }}>Parte Ray</Text><Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>R$ {parteRayConjunta.toFixed(2)}</Text></View>
          </View>
        </View>

        <View style={{ flexDirection: 'row', marginBottom: 24 }}>
          {/* O fundo do "A Receber" adapta para ficar sutil no escuro */}
          <View style={{ flex: 1, borderRadius: 16, padding: 16, backgroundColor: isDarkMode ? '#4c1d95' : '#fdf2f8', marginRight: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}><Text style={{ fontSize: 13, color: isDarkMode ? '#f9a8d4' : '#6b7280' }}>A Receber</Text><Ionicons name="people-outline" size={16} color={isDarkMode ? '#fbcfe8' : '#be185d'} /></View>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: isDarkMode ? '#fbcfe8' : '#be185d' }}>R$ {aReceberTerceiros.toFixed(2)}</Text>
          </View>
          {/* O fundo do "Individual" adapta para ficar sutil no escuro */}
          <View style={{ flex: 1, borderRadius: 16, padding: 16, backgroundColor: isDarkMode ? '#1e3a8a' : '#f0f9ff' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}><Text style={{ fontSize: 13, color: isDarkMode ? '#bfdbfe' : '#6b7280' }}>Individual</Text><Ionicons name="person-outline" size={16} color={isDarkMode ? '#bfdbfe' : '#0369a1'} /></View>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: isDarkMode ? '#bfdbfe' : '#0369a1' }}>R$ {seusGastosIndividuais.toFixed(2)}</Text>
          </View>
        </View>

        <View style={{ marginTop: 8 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 16 }}>Transações Recentes</Text>
          {ultimasTransacoes.length === 0 ? (
            <Text style={{ color: colors.subText, textAlign: 'center', marginTop: 20 }}>Nenhuma transação registrada ainda.</Text>
          ) : (
            ultimasTransacoes.map((item: any) => (
              <TouchableOpacity key={item.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, padding: 16, borderRadius: 12, marginBottom: 12 }} activeOpacity={0.7} onLongPress={() => deletarTransacaoDoFirebase(item.id)}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: item.type === 'RECEITA' ? (isDarkMode ? '#064e3b' : '#ecfdf5') : (isDarkMode ? '#374151' : '#f3f4f6'), justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                  <Ionicons name={item.type === 'RECEITA' ? "trending-up" : "cart-outline"} size={24} color={item.type === 'RECEITA' ? "#10b981" : colors.subText} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 }} numberOfLines={1}>{item.descricao}</Text>
                  <Text style={{ fontSize: 12, color: colors.subText }}>{item.accountId} • {item.tags ? item.tags[0] : ''}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4, color: item.type === 'RECEITA' ? '#10b981' : colors.text }}>{item.type === 'RECEITA' ? '+' : ''}R$ {item.amount.toFixed(2)}</Text>
                  <Text style={{ fontSize: 12, color: colors.subText }}>{formatarDataHora(item.dateParaExibir)}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
      <TouchableOpacity style={{ position: 'absolute', bottom: 100, right: 24, width: 64, height: 64, borderRadius: 32, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center', shadowColor: colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5, zIndex: 10 }} activeOpacity={0.8} onPress={() => router.push('/add-transaction')}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}