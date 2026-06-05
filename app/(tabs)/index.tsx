// app/(tabs)/index.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router'; // 👈 Importado o router para a navegação da edição
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useAccounts } from '../../hooks/useAccounts';
import { useIdentity } from '../../hooks/useIdentity';
import { useTheme } from '../../hooks/useTheme';
import { useTransactions } from '../../hooks/useTransactions';
import { deletarTransacaoDoFirebase } from '../../services/firebase/firestore';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function DashboardScreen() {
  const { transacoes, loading: loadingTransacoes } = useTransactions();
  const { contas, loadingContas } = useAccounts();
  const { colors, isDarkMode } = useTheme(); 
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
  
  const formatarDataHora = (dataIso: string) => {
    if (!dataIso) return '';
    const data = new Date(dataIso);
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }); // Removi a hora para ficar mais limpo visualmente
  };

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
        
        {/* CABEÇALHO E SELETOR DE MÊS (PÍLULA) */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 40 }}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text }}>Olá!</Text>
            <Text style={{ fontSize: 14, color: colors.subText, marginTop: 2, fontWeight: '500' }}>Seu resumo financeiro</Text>
          </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.card, padding: 6, borderRadius: 30, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, borderWidth: isDarkMode ? 1 : 0, borderColor: '#334155' }}>
            <TouchableOpacity onPress={irMesAnterior} style={{ padding: 8, backgroundColor: colors.accentLight, borderRadius: 24 }}><Ionicons name="chevron-back" size={16} color={colors.accent} /></TouchableOpacity>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.text, marginHorizontal: 6 }}>{mesFormatado}</Text>
            <TouchableOpacity onPress={irProximoMes} style={{ padding: 8, backgroundColor: colors.accentLight, borderRadius: 24 }}><Ionicons name="chevron-forward" size={16} color={colors.accent} /></TouchableOpacity>
          </View>
        </View>

        {/* CARTÃO DE PREVISÃO DE SALDO (SQUIRCLE) */}
        <LinearGradient 
          colors={colors.gradient as [string, string]} 
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} 
          style={{ borderRadius: 24, padding: 24, marginBottom: 20, elevation: 4, shadowColor: colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}><Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>Previsão de Saldo do Mês</Text><Ionicons name="wallet-outline" size={20} color="rgba(255,255,255,0.9)" /></View>
          <Text style={{ fontSize: 34, fontWeight: 'bold', color: '#ffffff', marginBottom: 16 }}>R$ {seuSaldoRestante.toFixed(2)}</Text>
          <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, marginBottom: 8 }}><View style={[{ height: 6, backgroundColor: '#ffffff', borderRadius: 3 }, { width: `${Math.min(porcentagemGasta, 100)}%` }]} /></View>
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 20, fontWeight: '500' }}>Comprometido: {porcentagemGasta.toFixed(0)}% da receita.</Text>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Ionicons name="arrow-up-circle" size={20} color="#6ee7b7" /><View><Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '600', textTransform: 'uppercase' }}>Receitas</Text><Text style={{ fontSize: 15, fontWeight: 'bold', color: '#ffffff' }}>R$ {suaReceitaTotal.toFixed(2)}</Text></View></View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Ionicons name="arrow-down-circle" size={20} color="#fca5a5" /><View><Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '600', textTransform: 'uppercase' }}>Despesas</Text><Text style={{ fontSize: 15, fontWeight: 'bold', color: '#ffffff' }}>R$ {suasDespesasTotais.toFixed(2)}</Text></View></View>
          </View>
        </LinearGradient>

        {/* CARTÃO DESPESAS CONJUNTAS */}
        <View style={{ backgroundColor: colors.card, borderRadius: 24, padding: 20, elevation: 2, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, borderWidth: isDarkMode ? 1 : 0, borderColor: '#334155' }}>
          <Text style={{ fontSize: 12, color: colors.subText, marginBottom: 6, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>Despesas Conjuntas</Text>
          <Text style={{ fontSize: 26, fontWeight: 'bold', color: colors.text, marginBottom: 16 }}>R$ {totalDespesasConjuntas.toFixed(2)}</Text>
          
          {/* Cápsula interna */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: isDarkMode ? '#334155' : '#f1f5f9' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, color: colors.subText, marginBottom: 4, fontWeight: '600', textTransform: 'uppercase' }}>Sua Parte</Text>
              <Text style={{ fontSize: 15, fontWeight: 'bold', color: colors.text }}>R$ {suaParteConjunta.toFixed(2)}</Text>
            </View>
            <View style={{ width: 1, backgroundColor: isDarkMode ? '#334155' : '#e2e8f0', marginHorizontal: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, color: colors.subText, marginBottom: 4, fontWeight: '600', textTransform: 'uppercase' }}>{nomeDoParceiro}</Text>
              <Text style={{ fontSize: 15, fontWeight: 'bold', color: colors.text }}>R$ {parteDoOutroConjunta.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* MINI CARDS (A RECEBER E INDIVIDUAL) */}
        <View style={{ flexDirection: 'row', marginBottom: 24 }}>
          <View style={{ flex: 1, borderRadius: 20, padding: 16, backgroundColor: isDarkMode ? '#4c1d95' : '#fdf2f8', marginRight: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}><Text style={{ fontSize: 12, fontWeight: 'bold', color: isDarkMode ? '#f9a8d4' : '#be185d', textTransform: 'uppercase' }}>A Receber</Text><Ionicons name="people" size={16} color={isDarkMode ? '#fbcfe8' : '#be185d'} /></View>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: isDarkMode ? '#fbcfe8' : '#be185d' }}>R$ {aReceberTerceiros.toFixed(2)}</Text>
          </View>
          
          <View style={{ flex: 1, borderRadius: 20, padding: 16, backgroundColor: isDarkMode ? '#1e3a8a' : '#f0f9ff' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}><Text style={{ fontSize: 12, fontWeight: 'bold', color: isDarkMode ? '#bfdbfe' : '#0369a1', textTransform: 'uppercase' }}>Individual</Text><Ionicons name="person" size={16} color={isDarkMode ? '#bfdbfe' : '#0369a1'} /></View>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: isDarkMode ? '#bfdbfe' : '#0369a1' }}>R$ {seusGastosIndividuais.toFixed(2)}</Text>
          </View>
        </View>

        {/* LISTA RECENTES (COMPACTO HORIZONTAL MELHORADO) */}
        <View>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 16, marginLeft: 4 }}>Atividades Recentes</Text>
          
          {ultimasTransacoes.length === 0 ? (
            <Text style={{ color: colors.subText, textAlign: 'center', marginTop: 10, fontSize: 14, fontStyle: 'italic' }}>Nenhuma transação registrada.</Text>
          ) : (
            ultimasTransacoes.map((item: any) => (
              <TouchableOpacity key={item.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, padding: 14, borderRadius: 16, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, borderWidth: isDarkMode ? 1 : 0, borderColor: '#334155' }} activeOpacity={0.7} onPress={() => handleOpcoesRecentes(item)}>
                
                {/* Ícone Squircle */}
                <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: item.type === 'RECEITA' ? (isDarkMode ? 'rgba(16, 185, 129, 0.2)' : '#ecfdf5') : colors.accentLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                  <Ionicons name={item.type === 'RECEITA' ? "trending-up" : "cart-outline"} size={20} color={item.type === 'RECEITA' ? "#10b981" : colors.accent} />
                </View>
                
                {/* Meio: Descrição + (Categoria e Tabela) */}
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={{ fontSize: 15, fontWeight: 'bold', color: colors.text, marginBottom: 2 }} numberOfLines={1}>{item.descricao}</Text>
                  
                  {/* 👇 Tags adicionadas para leitura rápida */}
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 11, color: colors.subText, fontWeight: '600' }}>{item.tags ? item.tags[0] : 'Outros'}</Text>
                    <Text style={{ fontSize: 11, color: colors.subText, marginHorizontal: 4 }}>•</Text>
                    <Text style={{ fontSize: 11, color: colors.subText }}>{item.accountId}</Text>
                  </View>
                </View>
                
                {/* Direita: Valor + Status + Data */}
                <View style={{ alignItems: 'flex-end', justifyContent: 'center', paddingRight: 10, borderRightWidth: 1, borderRightColor: isDarkMode ? '#334155' : '#f1f5f9' }}>
                  <Text style={{ fontSize: 15, fontWeight: 'bold', marginBottom: 2, color: item.type === 'RECEITA' ? '#10b981' : colors.text }}>{item.type === 'RECEITA' ? '+' : ''}R$ {item.amount.toFixed(2)}</Text>
                  
                  {/* 👇 Status Visual Adicionado */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    {item.isPaid ? (
                      <Text style={{ fontSize: 10, color: '#10b981', fontWeight: 'bold' }}>✅ {formatarDataHora(item.dateParaExibir)}</Text>
                    ) : (
                      <Text style={{ fontSize: 10, color: colors.subText, fontWeight: '600' }}>⏳ {formatarDataHora(item.dateParaExibir)}</Text>
                    )}
                  </View>
                </View>

                {/* 👇 Os 3 Pontinhos no canto */}
                <View style={{ paddingLeft: 10 }}>
                  <Ionicons name="ellipsis-vertical" size={18} color={colors.subText} />
                </View>

              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}