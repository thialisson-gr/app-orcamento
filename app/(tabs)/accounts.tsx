// app/(tabs)/accounts.tsx
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { AccountCard } from '../../components/AccountCard';
import { MonthSelector } from '../../components/MonthSelector';
import { ScreenHeader } from '../../components/ScreenHeader';
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
      <ScreenHeader title="Minhas Tabelas" />
      
      {/* SELETOR DE MÊS */}
      <MonthSelector 
                mesFormatado={mesFormatado} 
                onPrev={irMesAnterior} 
                onNext={irProximoMes} 
      />

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
          contasExibidas.map((conta) => (
            <AccountCard 
              key={conta.id}
              conta={conta}
              transacoes={transacoes}
              mesAtual={mesAtual}
              anoAtual={anoAtual}
              perfil={perfil}
              onPress={() => abrirConta(conta.nome)}
              onOptionsPress={() => handleOpcoesConta(conta)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}