// app/(tabs)/accounts.tsx
import { Ionicons } from '@expo/vector-icons';
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
  const [mostrarInativas, setMostrarInativas] = useState(false);

  const mesAtual = dataFiltro.getMonth();
  const anoAtual = dataFiltro.getFullYear();
  const mesFormatado = `${MESES[mesAtual]} ${anoAtual}`;

  const irMesAnterior = () => setDataFiltro(new Date(anoAtual, mesAtual - 1, 1));
  const irProximoMes = () => setDataFiltro(new Date(anoAtual, mesAtual + 1, 1));

  const handleOpcoesConta = (conta: any) => {
    // 👇 O CADEADO DE SEGURANÇA (MODO LEITURA)
    const isModoLeitura = 
      conta.tipo !== 'COMUM' && 
      conta.tipo !== 'RECEITA' && 
      conta.dono && 
      conta.dono !== perfil;

    // Se estiver em modo leitura, avisa que não tem permissão e corta a função
    if (isModoLeitura) {
      return Alert.alert('Acesso Negado', 'Você não tem permissão para editar ou excluir a tabela do seu parceiro.');
    }

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
      { 
        text: 'Excluir', 
        style: 'destructive', 
        onPress: () => {
          // 👇 TRAVA DE SEGURANÇA: Verifica se há transações não pagas / parcelas a vencer nesta tabela
          const temPendencias = transacoes.some(t => t.accountId === conta.nome && !t.isPaid);

          if (temPendencias) {
            return Alert.alert(
              'Ação Bloqueada', 
              'Não é possível excluir esta tabela pois ela possui transações ou parcelas a vencer. Conclua ou elimine as pendências primeiro.'
            );
          }

          // Se a tabela estiver zerada ou apenas com histórico pago, pede dupla confirmação
          Alert.alert(
            'Confirmar Exclusão',
            `Tem certeza que deseja eliminar a tabela "${conta.nome}" definitivamente?`,
            [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Sim, Excluir', style: 'destructive', onPress: () => deletarContaNoFirebase(conta.id) }
            ]
          );
        } 
      }
    ]);
  };
  
  const abrirConta = (nome: string) => router.push(`/account/${encodeURIComponent(nome)}`);

  if (loadingContas || loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}><ActivityIndicator size="large" color={colors.accent} /></View>;

  // 1. Descobrir quais tabelas têm PELO MENOS UMA transação neste mês específico
  const contasAtivasNesteMes = new Set(
    transacoes
      .filter((t) => {
        const d = new Date(t.paymentDate || t.date);
        return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
      })
      .map((t) => t.accountId)
  );

  // 2. Filtrar a lista de exibição
  let contasExibidas = contas.filter((c) => {
    // Se a tabela NÃO tem movimento neste mês e o botão de mostrar inativas está desligado, esconde ela!
    if (!contasAtivasNesteMes.has(c.nome) && !mostrarInativas) {
      return false;
    }

    // Mantém o filtro de abas (Todas, Receitas, Comuns...) funcionando
    if (filtroAtivo !== 'TODAS') {
      return c.tipo === filtroAtivo;
    }
    
    return true;
  });

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

      {/* NOVO BOTÃO: MOSTRAR/OCULTAR INATIVAS */}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, marginBottom: 10 }}>
        <TouchableOpacity 
          onPress={() => setMostrarInativas(!mostrarInativas)} 
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 }}
          activeOpacity={0.7}
        >
          <Ionicons name={mostrarInativas ? "eye-off-outline" : "eye-outline"} size={16} color={colors.subText} />
          <Text style={{ fontSize: 13, color: colors.subText, fontWeight: '500' }}>
            {mostrarInativas ? "Ocultar tabelas inativas" : "Mostrar tabelas inativas"}
          </Text>
        </TouchableOpacity>
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