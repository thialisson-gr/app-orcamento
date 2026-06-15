// components/ScreenHeader.tsx
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, Text } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface ScreenHeaderProps {
  title: string;
}

export function ScreenHeader({ title }: ScreenHeaderProps) {
  const { colors } = useTheme();

  return (
    <LinearGradient 
      colors={colors.gradient as [string, string]} 
      start={{ x: 0, y: 0 }} 
      end={{ x: 1, y: 1 }} 
      style={{ 
        paddingTop: Platform.OS === 'ios' ? 60 : 40, 
        paddingBottom: 20, 
        paddingHorizontal: 20, 
        alignItems: 'center',
        // As linhas abaixo dão um charme arredondado nas pontas do cabeçalho
        borderBottomLeftRadius: 20, 
        borderBottomRightRadius: 20,
        elevation: 4,
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6
      }}
    >
      <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#ffffff', letterSpacing: 0.5 }}>
        {title}
      </Text>
    </LinearGradient>
  );
}