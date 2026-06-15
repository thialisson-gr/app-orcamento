// components/AccountSplitSlider.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface AccountSplitSliderProps {
  porcentagemEu: number;
  onAumentar: () => void;
  onDiminuir: () => void;
  nomeParceiro: string;
}

export function AccountSplitSlider({ porcentagemEu, onAumentar, onDiminuir, nomeParceiro }: AccountSplitSliderProps) {
  const { colors, isDarkMode } = useTheme();

  return (
    <View style={{ backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: isDarkMode ? '#334155' : '#e2e8f0', marginBottom: 24 }}>
      <Text style={{ fontSize: 13, fontWeight: 'bold', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5, color: colors.text }}>
        Sua Parte na Tabela
      </Text>
      
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, borderRadius: 16, padding: 8, borderWidth: 1, borderColor: isDarkMode ? '#334155' : '#e2e8f0' }}>
        <TouchableOpacity onPress={onDiminuir} style={{ width: 56, height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9' }} activeOpacity={0.7}>
          <Ionicons name="remove" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.accent }}>{porcentagemEu}%</Text>
        
        <TouchableOpacity onPress={onAumentar} style={{ width: 56, height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9' }} activeOpacity={0.7}>
          <Ionicons name="add" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={{ height: 10, borderRadius: 5, flexDirection: 'row', overflow: 'hidden', marginTop: 24, backgroundColor: isDarkMode ? '#1e293b' : '#e2e8f0' }}>
        <View style={{ width: `${porcentagemEu}%`, backgroundColor: colors.accent }} />
      </View>

      <View style={{ flexDirection: 'row', marginTop: 12, justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 13, color: colors.accent, fontWeight: 'bold' }}>Você: R$ {porcentagemEu}</Text>
        <Text style={{ fontSize: 13, color: colors.subText, fontWeight: '600' }}>{nomeParceiro}: R$ {100 - porcentagemEu}</Text>
      </View>
      
      <Text style={{ fontSize: 12, color: colors.subText, marginTop: 16, textAlign: 'center', fontStyle: 'italic' }}>
        A cada R$ 100 gastos nesta tabela, você assumirá R$ {porcentagemEu} e {nomeParceiro} assumirá R$ {100 - porcentagemEu}.
      </Text>
    </View>
  );
}