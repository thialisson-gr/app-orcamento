// components/AccountPickerModal.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface AccountPickerModalProps {
  visible: boolean;
  onClose: () => void;
  contas: any[];
  contaSelecionada: string;
  onSelectConta: (nome: string) => void;
}

export function AccountPickerModal({ visible, onClose, contas, contaSelecionada, onSelectConta }: AccountPickerModalProps) {
  const { colors, isDarkMode } = useTheme();

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: isDarkMode ? '#334155' : '#e2e8f0' }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Selecione a Tabela</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <Ionicons name="close-circle" size={28} color={colors.subText} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
            {contas.length === 0 ? (
              <Text style={{ textAlign: 'center', color: colors.subText, marginTop: 20 }}>Nenhuma tabela disponível.</Text>
            ) : (
              contas.map(conta => (
                <TouchableOpacity 
                  key={conta.id} 
                  style={[styles.modalItem, { borderBottomColor: isDarkMode ? '#334155' : '#f1f5f9' }, contaSelecionada === conta.nome && { backgroundColor: colors.accentLight }]} 
                  onPress={() => onSelectConta(conta.nome)}
                >
                  <Text style={{ fontSize: 16, color: colors.text, fontWeight: contaSelecionada === conta.nome ? 'bold' : '500' }}>{conta.nome}</Text>
                  {contaSelecionada === conta.nome && <Ionicons name="checkmark" size={22} color={colors.accent} />}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, borderWidth: 1, borderBottomWidth: 0 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 }
});