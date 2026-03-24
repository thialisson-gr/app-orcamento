// services/firebase/config.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Importamos TUDO de dentro do auth e damos o apelido de "firebaseAuth"
import * as firebaseAuth from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Inicializa o app
const app = initializeApp(firebaseConfig);

// Inicializa o Banco de Dados
export const db = getFirestore(app);

// Inicializa a Autenticação com "memória" para não deslogar sozinho no celular
export const auth = firebaseAuth.initializeAuth(app, {
  persistence: (firebaseAuth as any).getReactNativePersistence(AsyncStorage),
});
