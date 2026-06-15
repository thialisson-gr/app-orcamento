// components/CategorySelector.tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';

export const TAGS_DESPESA = ['🛒 Super', '🍔 Lazer', '🏠 Casa', '🚗 Transp.', '🏥 Saúde', '🛍️ Compras', '⚡ Contas', '🏷️ Outros'];
export const TAGS_RECEITA = ['💰 Salário', '💸 Pix', '🏦 Transf.', '📈 Rends.', '🎁 Outros'];

interface CategorySelectorProps {
  tipo: 'DESPESA' | 'RECEITA';
  tagSelecionada: string;
  onSelectTag: (tag: string) => void;
}

export function CategorySelector({ tipo, tagSelecionada, onSelectTag }: CategorySelectorProps) {
  const { colors, isDarkMode } = useTheme();
  const tags = tipo === 'DESPESA' ? TAGS_DESPESA : TAGS_RECEITA;

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
      {tags.map((tag) => (
        <TouchableOpacity 
          key={tag} 
          style={[
            styles.chipGrade, 
            { backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', borderColor: isDarkMode ? '#334155' : '#e2e8f0' }, 
            tagSelecionada === tag && { backgroundColor: colors.accentLight, borderColor: colors.accent }
          ]} 
          onPress={() => onSelectTag(tag)}
        >
          <Text style={[
            styles.chipText, 
            { color: isDarkMode ? '#cbd5e1' : '#475569' }, 
            tagSelecionada === tag && { color: colors.accent, fontWeight: 'bold' }
          ]}>{tag}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chipGrade: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, marginRight: 8, marginBottom: 10, borderWidth: 1 }, 
  chipText: { fontSize: 13, fontWeight: '600' }, 
});