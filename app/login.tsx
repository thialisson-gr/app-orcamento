// app/login.tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth } from '../services/firebase/config';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !senha) return Alert.alert('Atenção', 'Preencha seu e-mail e senha.');

    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), senha);
      router.replace('/(tabs)'); // Login deu certo? Manda pro Dashboard!
    } catch (error: any) {
      Alert.alert('Erro', 'E-mail ou senha incorretos. Verifique e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="wallet" size={72} color="#3b82f6" />
        </View>
        <Text style={styles.title}>Bem-vindo!</Text>
        <Text style={styles.subtitle}>Faça login para gerenciar suas contas.</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            placeholder="seu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Senha</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            secureTextEntry
            value={senha}
            onChangeText={setSenha}
          />
        </View>

        <TouchableOpacity style={[styles.loginButton, isLoading && { opacity: 0.7 }]} onPress={handleLogin} disabled={isLoading} activeOpacity={0.8}>
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginButtonText}>Entrar</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  iconContainer: { alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1f2937', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#6b7280', textAlign: 'center', marginBottom: 32 },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 16, fontSize: 16, color: '#1f2937' },
  loginButton: { backgroundColor: '#3b82f6', borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 12 },
  loginButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});