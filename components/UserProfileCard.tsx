// components/UserProfileCard.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface UserProfileCardProps {
  inicial: string;
  nomeExibicao: string;
  emailLogado: string;
}

export function UserProfileCard({ inicial, nomeExibicao, emailLogado }: UserProfileCardProps) {
  const { colors, isDarkMode } = useTheme();

  return (
    <View style={[
      styles.userCard, 
      { backgroundColor: colors.card, borderColor: isDarkMode ? '#334155' : 'transparent', borderWidth: isDarkMode ? 1 : 0 }
    ]}>
      <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
        <Text style={styles.avatarText}>{inicial}</Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: colors.text }]}>{nomeExibicao}</Text>
        <Text style={[styles.userEmail, { color: colors.subText }]}>{emailLogado}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  userCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
    borderRadius: 24, 
    marginBottom: 24, 
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 6 
  }, 
  avatar: { 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 16 
  }, 
  avatarText: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#ffffff' 
  }, 
  userInfo: { 
    flex: 1 
  }, 
  userName: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 4, 
    textTransform: 'capitalize' 
  }, 
  userEmail: { 
    fontSize: 14 
  }
});