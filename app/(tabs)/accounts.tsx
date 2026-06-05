// app/(tabs)/accounts.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useAccounts } from '../../hooks/useAccounts';
import { useIdentity } from '../../hooks/useIdentity';
import { useTheme } from '../../hooks/useTheme';
import { useTransactions } from '../../hooks/useTransactions';
import { deletarContaNoFirebase } from '../../services/firebase/firestore';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const FILTROS = [
  { id: 'TODAS', label: 'Todas' },
  { id: 'RECEITA', label: 'Receitas' },
  { id: 'COMUM', label: 'Comuns' },
  { id: 'INDIVIDUAL', label: 'Individuais' },
  { id: 'TERCEIROS', label: 'Terceiros' }
];

export default function AccountsScreen() {
  const { contas, loadingContas } = useAccounts();
  const { transacoes, loading } = useTransactions();
  const { colors, isDarkMode } = useTheme(); 
  const { perfil } = useIdentity(); 

  const [dataFiltro, setDataFiltro] = useState(new Date());
  const [filtroAtivo, setFiltroAtivo] = useState('TODAS');

  const mesAtual = dataFiltro.getMonth();
  const anoAtual = dataFiltro.getFullYear();
  const mesFormatado = `${MESES[mesAtual]} ${anoAtual}`;

  const irMesAnterior = () => setDataFiltro(new Date(anoAtual, mesAtual - 1, 1));
  const irProximoMes = () => setDataFiltro(new Date(anoAtual, mesAtual + 1, 1));

  const handleOpcoesConta = (conta: any) => {
    Alert.alert('Opções', `O que deseja fazer com a tabela "${conta.nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: 'Editar', 
        onPress: () => router.push({
          pathname: '/edit-account',
          params: {
            id: conta.id,
            nomeOriginal: conta.nome,
            tipoOriginal: conta.tipo,
            donoOriginal: conta.dono || 'EU',
            porcentagemOriginal: conta.splitRule?.me?.toString() || '50'
          }
        })
      },
      { text: 'Excluir', style: 'destructive', onPress: () => deletarContaNoFirebase(conta.id) }
    ]);
  };
  
  const abrirConta = (nome: string) => router.push(`/account/${encodeURIComponent(nome)}`);

  if (loadingContas || loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}><ActivityIndicator size="large" color={colors.accent} /></View>;

  let contasExibidas = contas;
  if (filtroAtivo !== 'TODAS') {
    contasExibidas = contas.filter(c => c.tipo === filtroAtivo);
  }

  const ordemTipo: Record<string, number> = { 'RECEITA': 1, 'COMUM': 2, 'INDIVIDUAL': 3, 'TERCEIROS': 4 };
  contasExibidas.sort((a, b) => ordemTipo[a.tipo] - ordemTipo[b.tipo]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: 10, paddingTop: Platform.OS === 'ios' ? 60 : 40, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: isDarkMode ? '#334155' : '#e2e8f0', alignItems: 'center' }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>Minhas Tabelas</Text>
      </View>
      
      {/* SELETOR DE MÊS */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.card, padding: 6, marginHorizontal: 16, marginTop: 16, borderRadius: 30, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, borderWidth: isDarkMode ? 1 : 0, borderColor: '#334155' }}>
        <TouchableOpacity onPress={irMesAnterior} style={{ padding: 10, backgroundColor: colors.accentLight, borderRadius: 24 }}><Ionicons name="chevron-back" size={18} color={colors.accent} /></TouchableOpacity>
        <Text style={{ fontSize: 15, fontWeight: 'bold', color: colors.text }}>{mesFormatado}</Text>
        <TouchableOpacity onPress={irProximoMes} style={{ padding: 10, backgroundColor: colors.accentLight, borderRadius: 24 }}><Ionicons name="chevron-forward" size={18} color={colors.accent} /></TouchableOpacity>
      </View>

      {/* FILTROS */}
      <View style={{ marginTop: 16 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {FILTROS.map(filtro => (
            <TouchableOpacity 
              key={filtro.id} 
              onPress={() => setFiltroAtivo(filtro.id)}
              style={{ paddingVertical: 10, paddingHorizontal: 18, borderRadius: 24, marginRight: 8, marginBottom: 12, borderWidth: 1, borderColor: filtroAtivo === filtro.id ? colors.accent : (isDarkMode ? '#475569' : '#e2e8f0'), backgroundColor: filtroAtivo === filtro.id ? colors.accentLight : (isDarkMode ? '#1e293b' : '#f8fafc') }}
            >
              <Text style={{ fontSize: 12, fontWeight: filtroAtivo === filtro.id ? 'bold' : '600', color: filtroAtivo === filtro.id ? colors.accent : (isDarkMode ? '#cbd5e1' : '#64748b') }}>{filtro.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        {contasExibidas.length === 0 ? (
          <Text style={{ textAlign: 'center', color: colors.subText, marginTop: 40, fontStyle: 'italic', fontSize: 15 }}>Nenhuma tabela encontrada.</Text>
        ) : (
          contasExibidas.map((conta) => {
            const isReceita = conta.tipo === 'RECEITA';
            const transacoesContaMes = transacoes.filter(t => t.accountId === conta.nome && new Date(t.paymentDate || t.date).getMonth() === mesAtual && new Date(t.paymentDate || t.date).getFullYear() === anoAtual);
            
            const totalFatura = transacoesContaMes.filter(t => t.type === (isReceita ? 'RECEITA' : 'DESPESA')).reduce((acc, t) => acc + t.amount, 0);
            const totalConcluido = transacoesContaMes.filter(t => t.type === (isReceita ? 'RECEITA' : 'DESPESA') && t.isPaid).reduce((acc, t) => acc + t.amount, 0);
            const pendente = totalFatura - totalConcluido;

            let iconName = 'wallet';
            let gradColors = colors.gradient; 

            if (conta.tipo === 'RECEITA') {
              iconName = 'trending-up';
              gradColors = ['#10b981', '#059669']; 
            } else if (conta.tipo === 'COMUM') {
              iconName = 'home';
            } else if (conta.tipo === 'INDIVIDUAL') {
              iconName = 'person';
              gradColors = ['#3b82f6', '#2563eb']; 
            } else if (conta.tipo === 'TERCEIROS') {
              iconName = 'people';
              gradColors = ['#f43f5e', '#e11d48']; 
            }

            let minhaPerc = 50;
            let parcPerc = 50;
            if (conta.tipo === 'COMUM') {
              if (perfil === 'RAY') {
                minhaPerc = conta.splitRule?.spouse ?? 50;
                parcPerc = conta.splitRule?.me ?? 50;
              } else {
                minhaPerc = conta.splitRule?.me ?? 50;
                parcPerc = conta.splitRule?.spouse ?? 50;
              }
            }

            return (
              /* 👇 NOVO FORMATO: COMPACTO HORIZONTAL */
              <View key={conta.id} style={{ backgroundColor: colors.card, borderRadius: 16, padding: 14, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, borderWidth: isDarkMode ? 1 : 0, borderColor: '#334155' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  
                  {/* Bloco Esquerdo: Ícone + Textos */}
                  <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }} activeOpacity={0.7} onPress={() => abrirConta(conta.nome)}>
                    
                    {/* Ícone Reduzido */}
                    <LinearGradient
                      colors={gradColors as [string, string]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={{ width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}
                    >
                      <Ionicons name={iconName as any} size={20} color="#ffffff" />
                    </LinearGradient>
                    
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: 'bold', color: colors.text }} numberOfLines={1}>{conta.nome}</Text>
                      {conta.tipo === 'COMUM' ? (
                        <Text style={{ fontSize: 11, color: colors.subText, marginTop: 2, fontWeight: '500' }}>
                          Você: {minhaPerc}% • Parc: {parcPerc}%
                        </Text>
                      ) : (
                        <Text style={{ fontSize: 11, color: colors.subText, marginTop: 2, fontWeight: '500' }}>
                          {isReceita ? 'Entrada' : 'Despesa'} {conta.tipo.charAt(0) + conta.tipo.slice(1).toLowerCase()}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>

                  {/* Bloco Direito: Valores Compactados */}
                  <TouchableOpacity style={{ alignItems: 'flex-end', paddingRight: 10, borderRightWidth: 1, borderRightColor: isDarkMode ? '#334155' : '#f1f5f9', marginRight: 8, justifyContent: 'center' }} activeOpacity={0.7} onPress={() => abrirConta(conta.nome)}>
                    <Text style={{ fontSize: 10, color: colors.subText, marginBottom: 2, fontWeight: '700', textTransform: 'uppercase' }}>
                      {isReceita ? 'A Receber' : 'Pendente'}
                    </Text>
                    <Text style={[{ fontSize: 15, fontWeight: 'bold' }, pendente > 0 ? { color: isReceita ? '#f59e0b' : '#ef4444' } : { color: '#10b981' }]}>
                      R$ {pendente.toFixed(2)}
                    </Text>
                    <Text style={{ fontSize: 10, color: colors.subText, marginTop: 2, fontWeight: '500' }}>
                      De R$ {totalFatura.toFixed(2)}
                    </Text>
                  </TouchableOpacity>

                  {/* Opções */}
                  <TouchableOpacity style={{ paddingVertical: 8, paddingLeft: 4 }} onPress={() => handleOpcoesConta(conta)}>
                    <Ionicons name="ellipsis-vertical" size={18} color={colors.subText} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}