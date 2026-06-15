// components/TransactionTypeSelector.tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface TransactionTypeSelectorProps {
  tipo: 'DESPESA' | 'RECEITA';
  onChange: (tipo: 'DESPESA' | 'RECEITA') => void;
  labelDespesa?: string;
  labelReceita?: string;
}

export function TransactionTypeSelector({ tipo, onChange, labelDespesa = "Despesa", labelReceita = "Receita" }: TransactionTypeSelectorProps) {
  const { isDarkMode } = useTheme();

  return (
    <View style={[styles.typeSelector, { backgroundColor: isDarkMode ? '#0f172a' : '#f1f5f9', borderWidth: isDarkMode ? 1 : 0, borderColor: '#334155' }]}>
      <TouchableOpacity 
        style={[styles.typeBtn, tipo === 'DESPESA' && styles.typeBtnDespesa]} 
        onPress={() => onChange('DESPESA')}
      >
        <Text style={[styles.typeText, { color: isDarkMode ? '#94a3b8' : '#64748b' }, tipo === 'DESPESA' && styles.typeTextActive]}>
          {labelDespesa}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.typeBtn, tipo === 'RECEITA' && styles.typeBtnReceita]} 
        onPress={() => onChange('RECEITA')}
      >
        <Text style={[styles.typeText, { color: isDarkMode ? '#94a3b8' : '#64748b' }, tipo === 'RECEITA' && styles.typeTextActive]}>
          {labelReceita}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  typeSelector: { flexDirection: 'row', borderRadius: 30, padding: 6, marginBottom: 32, marginHorizontal: 24 }, 
  typeBtn: { flex: 1, paddingVertical: 12, borderRadius: 26, alignItems: 'center' }, 
  typeBtnDespesa: { backgroundColor: '#ef4444', elevation: 2, shadowColor: '#ef4444', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 }, 
  typeBtnReceita: { backgroundColor: '#10b981', elevation: 2, shadowColor: '#10b981', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 }, 
  typeText: { fontSize: 15, fontWeight: 'bold' }, 
  typeTextActive: { color: '#ffffff' },
});