// app/(tabs)/profile.tsx
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import React, { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { auth } from '../../services/firebase/config';

export default function ProfileScreen() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 👇 Pega os dados reais de quem está logado no momento!
  const user = auth.currentUser;
  const emailLogado = user?.email || 'Usuário Desconhecido';
  const inicial = emailLogado.charAt(0).toUpperCase();
  const nomeExibicao = emailLogado.split('@')[0]; // Pega a parte antes do @ para ser o "nome"

  const handleLogout = () => {
    Alert.alert(
      'Sair da Conta',
      'Tem certeza que deseja sair do aplicativo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sair', 
          style: 'destructive', 
          onPress: async () => {
            // 👇 Desloga do Firebase! O sistema vai perceber e te jogar pro Login na hora.
            await signOut(auth);
          } 
        }
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert('Exportar Dados', 'Em breve! Vamos gerar um PDF/Excel lindo com seus dados.');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meu Perfil</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* CARD DO USUÁRIO */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{inicial}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{nomeExibicao}</Text>
            <Text style={styles.userEmail}>{emailLogado}</Text>
          </View>
          <TouchableOpacity style={styles.editBtn} activeOpacity={0.7}>
            <Ionicons name="pencil" size={18} color="#3b82f6" />
          </TouchableOpacity>
        </View>

        {/* SEÇÃO: PREFERÊNCIAS */}
        <Text style={styles.sectionTitle}>Preferências</Text>
        <View style={styles.menuGroup}>
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: '#f3f4f6' }]}>
                <Ionicons name="moon" size={20} color="#4b5563" />
              </View>
              <Text style={styles.menuItemText}>Modo Escuro</Text>
            </View>
            <Switch value={isDarkMode} onValueChange={setIsDarkMode} trackColor={{ false: '#d1d5db', true: '#93c5fd' }} thumbColor={isDarkMode ? '#3b82f6' : '#f3f4f6'} />
          </View>
        </View>

        {/* SEÇÃO: DADOS E CONTAS */}
        <Text style={styles.sectionTitle}>Dados e Compartilhamento</Text>
        <View style={styles.menuGroup}>
          <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: '#eff6ff' }]}>
                <Ionicons name="people" size={20} color="#3b82f6" />
              </View>
              <Text style={styles.menuItemText}>Regra de Divisão Padrão</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem} onPress={handleExportData} activeOpacity={0.7}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: '#ecfdf5' }]}>
                <Ionicons name="download" size={20} color="#10b981" />
              </View>
              <Text style={styles.menuItemText}>Exportar Planilha / PDF</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
          </TouchableOpacity>
        </View>

        {/* SEÇÃO: SEGURANÇA */}
        <Text style={styles.sectionTitle}>Segurança</Text>
        <View style={styles.menuGroup}>
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout} activeOpacity={0.7}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: '#fef2f2' }]}>
                <Ionicons name="log-out" size={20} color="#ef4444" />
              </View>
              <Text style={[styles.menuItemText, { color: '#ef4444', fontWeight: 'bold' }]}>Sair da Conta</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.appVersion}>Versão 1.0.0 • 2026</Text>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' }, header: { padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 50, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }, headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' }, scrollContent: { padding: 20, paddingBottom: 100 }, userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 20, borderRadius: 16, marginBottom: 24, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 }, avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', marginRight: 16 }, avatarText: { fontSize: 24, fontWeight: 'bold', color: '#ffffff' }, userInfo: { flex: 1 }, userName: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 4, textTransform: 'capitalize' }, userEmail: { fontSize: 14, color: '#6b7280' }, editBtn: { padding: 8, backgroundColor: '#eff6ff', borderRadius: 12 }, sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#6b7280', marginBottom: 12, marginLeft: 4, textTransform: 'uppercase' }, menuGroup: { backgroundColor: '#ffffff', borderRadius: 16, overflow: 'hidden', marginBottom: 24, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 }, menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }, menuItemLeft: { flexDirection: 'row', alignItems: 'center' }, menuIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 }, menuItemText: { fontSize: 16, fontWeight: '500', color: '#1f2937' }, divider: { height: 1, backgroundColor: '#f3f4f6', marginLeft: 68 }, appVersion: { textAlign: 'center', color: '#9ca3af', fontSize: 12, marginTop: 10 },
});