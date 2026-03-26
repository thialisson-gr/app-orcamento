// app/(tabs)/profile.tsx
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { auth } from '../../services/firebase/config';
import { buscarRegraPadrao, salvarRegraPadrao } from '../../services/firebase/firestore';

export default function ProfileScreen() {
  const { isDarkMode, activeTheme, setTheme, colors } = useTheme(); 
  const [modalRegraVisible, setModalRegraVisible] = useState(false);
  const [regraEu, setRegraEu] = useState(50);
  const regraRay = 100 - regraEu;
  
  const user = auth.currentUser;
  const emailLogado = user?.email || 'Usuário Desconhecido';
  const inicial = emailLogado.charAt(0).toUpperCase();
  const nomeExibicao = emailLogado.split('@')[0];

  useEffect(() => { buscarRegraPadrao().then(regra => setRegraEu(regra.me)); }, []);

  const handleSalvarRegra = async () => {
    await salvarRegraPadrao(regraEu, regraRay);
    setModalRegraVisible(false);
  };

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja sair?', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Sair', style: 'destructive', onPress: async () => await signOut(auth) }]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: isDarkMode ? '#374151' : '#e5e7eb' }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Perfil</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.userCard, { backgroundColor: colors.card }]}>
          <View style={[styles.avatar, { backgroundColor: colors.accent }]}><Text style={styles.avatarText}>{inicial}</Text></View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>{nomeExibicao}</Text>
            <Text style={[styles.userEmail, { color: colors.subText }]}>{emailLogado}</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.subText }]}>Aparência Vibrante</Text>
        <View style={[styles.menuGroup, { backgroundColor: colors.card, padding: 16 }]}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={() => setTheme('indigo')} style={[styles.themeOption, activeTheme === 'indigo' && { borderColor: '#6366f1', borderWidth: 2 }]}>
              <View style={[styles.colorCircle, { backgroundColor: '#6366f1' }]} />
              <Text style={{ fontSize: 11, color: colors.text, marginTop: 6, fontWeight: activeTheme === 'indigo' ? 'bold' : 'normal' }}>Índigo</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setTheme('pink')} style={[styles.themeOption, activeTheme === 'pink' && { borderColor: '#ec4899', borderWidth: 2 }]}>
              <View style={[styles.colorCircle, { backgroundColor: '#ec4899' }]} />
              <Text style={{ fontSize: 11, color: colors.text, marginTop: 6, fontWeight: activeTheme === 'pink' ? 'bold' : 'normal' }}>Pink</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setTheme('dark')} style={[styles.themeOption, activeTheme === 'dark' && { borderColor: '#06b6d4', borderWidth: 2 }]}>
              <View style={[styles.colorCircle, { backgroundColor: '#1e293b', borderWidth: 2, borderColor: '#06b6d4' }]} />
              <Text style={{ fontSize: 11, color: colors.text, marginTop: 6, fontWeight: activeTheme === 'dark' ? 'bold' : 'normal' }}>Cyber</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.subText }]}>Configurações</Text>
        <View style={[styles.menuGroup, { backgroundColor: colors.card }]}>
          <TouchableOpacity style={styles.menuItem} onPress={() => setModalRegraVisible(true)} activeOpacity={0.7}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: colors.accentLight }]}><Ionicons name="people" size={18} color={colors.accent} /></View>
              <Text style={[styles.menuItemText, { color: colors.text }]}>Regra Padrão ({regraEu}/{regraRay})</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={isDarkMode ? '#4b5563' : '#d1d5db'} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.subText }]}>Conta</Text>
        <View style={[styles.menuGroup, { backgroundColor: colors.card }]}>
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout} activeOpacity={0.7}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: isDarkMode ? '#7f1d1d' : '#fef2f2' }]}><Ionicons name="log-out" size={18} color="#ef4444" /></View>
              <Text style={[styles.menuItemText, { color: '#ef4444', fontWeight: 'bold' }]}>Sair</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal animationType="slide" transparent={true} visible={modalRegraVisible} onRequestClose={() => setModalRegraVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Regra Padrão</Text>
            <View style={{ backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc', padding: 16, borderRadius: 24, marginBottom: 20, borderWidth: isDarkMode ? 1 : 0, borderColor: '#334155' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>Sua Parte</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: isDarkMode ? '#475569' : '#e2e8f0' }}>
                  <TouchableOpacity onPress={() => regraEu > 0 && setRegraEu(regraEu - 1)} style={{ padding: 12 }}><Ionicons name="remove" size={16} color={colors.accent}/></TouchableOpacity>
                  <Text style={{ width: 36, textAlign: 'center', fontSize: 14, fontWeight: 'bold', color: colors.text }}>{regraEu}%</Text>
                  <TouchableOpacity onPress={() => regraEu < 100 && setRegraEu(regraEu + 1)} style={{ padding: 12 }}><Ionicons name="add" size={16} color={colors.accent}/></TouchableOpacity>
                </View>
              </View>
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: isDarkMode ? '#334155' : '#f1f5f9' }]} onPress={() => setModalRegraVisible(false)}><Text style={[styles.cancelBtnText, { color: isDarkMode ? '#cbd5e1' : '#64748b' }]}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: colors.accent }]} onPress={handleSalvarRegra}><Text style={styles.confirmBtnText}>Salvar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, header: { padding: 16, paddingTop: Platform.OS === 'ios' ? 60 : 50, borderBottomWidth: 1, alignItems: 'center' }, headerTitle: { fontSize: 18, fontWeight: 'bold' }, scrollContent: { padding: 16, paddingBottom: 100 }, userCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 20, elevation: 1 }, avatar: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 12 }, avatarText: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' }, userInfo: { flex: 1 }, userName: { fontSize: 18, fontWeight: 'bold', marginBottom: 2, textTransform: 'capitalize' }, userEmail: { fontSize: 12 }, sectionTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 8, marginLeft: 8, textTransform: 'uppercase' }, menuGroup: { borderRadius: 16, overflow: 'hidden', marginBottom: 20, elevation: 1 }, menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }, menuItemLeft: { flexDirection: 'row', alignItems: 'center' }, menuIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 }, menuItemText: { fontSize: 15, fontWeight: '500' }, divider: { height: 1, marginLeft: 64 }, themeOption: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'transparent', backgroundColor: 'rgba(0,0,0,0.03)' }, colorCircle: { width: 36, height: 36, borderRadius: 18, elevation: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }, modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 }, modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }, modalFooter: { flexDirection: 'row', gap: 12 }, cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' }, cancelBtnText: { fontSize: 15, fontWeight: 'bold' }, confirmBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' }, confirmBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' }
});