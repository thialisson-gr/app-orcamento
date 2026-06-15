// components/SplitRuleModal.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';


interface SplitRuleModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  regraEu: number;
  setRegraEu: (val: number) => void;
}

export function SplitRuleModal({ visible, onClose, onSave, regraEu, setRegraEu }: SplitRuleModalProps) {
  const { colors, isDarkMode } = useTheme();

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: isDarkMode ? '#334155' : '#e2e8f0' }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Regra Padrão do Casal</Text>
          
          <View style={{ backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc', padding: 20, borderRadius: 20, marginBottom: 24, borderWidth: 1, borderColor: isDarkMode ? '#334155' : '#e2e8f0' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 15, fontWeight: 'bold', color: colors.text }}>Sua Parte (%)</Text>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 16, padding: 6, borderWidth: 1, borderColor: isDarkMode ? '#475569' : '#e2e8f0' }}>
                <TouchableOpacity onPress={() => regraEu > 0 && setRegraEu(regraEu - 1)} style={[styles.pctBtn, { backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9' }]} activeOpacity={0.7}>
                  <Ionicons name="remove" size={20} color={colors.accent}/>
                </TouchableOpacity>
                
                <Text style={{ width: 48, textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: colors.accent }}>{regraEu}</Text>
                
                <TouchableOpacity onPress={() => regraEu < 100 && setRegraEu(regraEu + 1)} style={[styles.pctBtn, { backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9' }]} activeOpacity={0.7}>
                  <Ionicons name="add" size={20} color={colors.accent}/>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9', borderWidth: 1, borderColor: isDarkMode ? '#334155' : '#e2e8f0' }]} onPress={onClose}>
              <Text style={[styles.cancelBtnText, { color: isDarkMode ? '#cbd5e1' : '#64748b' }]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: colors.accent }]} onPress={onSave}>
              <Text style={styles.confirmBtnText}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }, 
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, borderWidth: 1, borderBottomWidth: 0 }, 
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }, 
  pctBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  modalFooter: { flexDirection: 'row', gap: 16 }, 
  cancelBtn: { flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center' }, 
  cancelBtnText: { fontSize: 16, fontWeight: 'bold' }, 
  confirmBtn: { flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6 }, 
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});