// components/ExportPDFButton.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface ExportPDFButtonProps {
  isExporting: boolean;
  onPress: () => void;
}

export function ExportPDFButton({ isExporting, onPress }: ExportPDFButtonProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity 
      style={[styles.exportBtn, { backgroundColor: colors.accent }, isExporting && { opacity: 0.7 }]} 
      onPress={onPress} 
      disabled={isExporting} 
      activeOpacity={0.8}
    >
      {isExporting ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <>
          <Ionicons name="document-text" size={22} color="#fff" />
          <Text style={styles.text}>Exportar Relatório PDF</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  exportBtn: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 16, 
    borderRadius: 20, 
    elevation: 3, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 6 
  },
  text: { 
    color: '#fff', 
    fontWeight: 'bold', 
    marginLeft: 10, 
    fontSize: 16 
  }
});