// components/ThemeSelector.tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';

export function ThemeSelector() {
  const { colors, isDarkMode, activeTheme, setTheme } = useTheme();

  return (
    <View style={[styles.menuGroup, { backgroundColor: colors.card, padding: 16, borderColor: isDarkMode ? '#334155' : 'transparent', borderWidth: isDarkMode ? 1 : 0 }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 6 }}>
        
        {/* Tema Esmeralda */}
        <TouchableOpacity onPress={() => setTheme('emerald')} style={[styles.themeOption, activeTheme === 'emerald' && { borderColor: '#10B981', borderWidth: 2, backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.1)' : '#ecfdf5' }]}>
          <View style={[styles.colorCircle, { backgroundColor: '#10B981' }]} />
          <Text style={[styles.themeText, { color: colors.text, fontWeight: activeTheme === 'emerald' ? 'bold' : '600' }]} numberOfLines={1}>Esmeralda</Text>
        </TouchableOpacity>
        
        {/* Tema Safira (Novo Azul) */}
        <TouchableOpacity onPress={() => setTheme('sapphire')} style={[styles.themeOption, activeTheme === 'sapphire' && { borderColor: '#2563EB', borderWidth: 2, backgroundColor: isDarkMode ? 'rgba(37, 99, 235, 0.1)' : '#eff6ff' }]}>
          <View style={[styles.colorCircle, { backgroundColor: '#2563EB' }]} />
          <Text style={[styles.themeText, { color: colors.text, fontWeight: activeTheme === 'sapphire' ? 'bold' : '600' }]} numberOfLines={1}>Safira</Text>
        </TouchableOpacity>

        {/* Tema Grafite (Novo Preto/Minimalista) */}
        <TouchableOpacity onPress={() => setTheme('graphite')} style={[styles.themeOption, activeTheme === 'graphite' && { borderColor: '#18181B', borderWidth: 2, backgroundColor: isDarkMode ? 'rgba(24, 24, 27, 0.1)' : '#f4f4f5' }]}>
          <View style={[styles.colorCircle, { backgroundColor: '#18181B' }]} />
          <Text style={[styles.themeText, { color: colors.text, fontWeight: activeTheme === 'graphite' ? 'bold' : '600' }]} numberOfLines={1}>Grafite</Text>
        </TouchableOpacity>
        
        {/* Tema Cyber Dark */}
        <TouchableOpacity onPress={() => setTheme('dark')} style={[styles.themeOption, activeTheme === 'dark' && { borderColor: '#06b6d4', borderWidth: 2, backgroundColor: 'rgba(6, 182, 212, 0.1)' }]}>
          <View style={[styles.colorCircle, { backgroundColor: '#1e293b', borderWidth: 2, borderColor: '#06b6d4' }]} />
          <Text style={[styles.themeText, { color: colors.text, fontWeight: activeTheme === 'dark' ? 'bold' : '600' }]} numberOfLines={1}>Cyber</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  menuGroup: { 
    borderRadius: 24, 
    overflow: 'hidden', 
    marginBottom: 24, 
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 6 
  },
  themeOption: { 
    flex: 1, 
    alignItems: 'center', 
    paddingVertical: 14, 
    paddingHorizontal: 4, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: 'transparent', 
    backgroundColor: 'rgba(0,0,0,0.02)' 
  }, 
  colorCircle: { 
    width: 34, 
    height: 34, 
    borderRadius: 17, 
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 4 
  },
  themeText: { 
    fontSize: 10, 
    marginTop: 8, 
    textAlign: 'center' 
  }
});