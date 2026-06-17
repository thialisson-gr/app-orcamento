// services/notifications.ts
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Platform } from 'react-native';
import { db } from './firebase/config';

// 👇 Deteta se estamos a usar o Expo Go
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let Notifications: any = null;

// Só carrega a biblioteca se NÃO estiver no Expo Go, evitando o crash!
if (!isExpoGo) {
  import('expo-notifications')
    .then((module) => {
      Notifications = module;
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    })
    .catch((e) => {
      console.log('Erro ao carregar expo-notifications', e);
    });
}

// FUNÇÃO 1: Pega o celular atual e vincula ao Thialisson ou a Rayane
export async function registrarTokenParaNotificacoes(perfil: 'EU' | 'RAY') {
  if (isExpoGo || !Notifications) {
    console.log('Notificações desativadas no Expo Go. Faça o build do APK para testar.');
    return;
  }

  if (!Device.isDevice) {
    console.log('Notificações push precisam de um celular físico para funcionar.');
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') return;

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    await setDoc(doc(db, 'tokens', perfil), { 
      token, 
      atualizadoEm: new Date().toISOString() 
    });
    
  } catch (error) {
    console.log('Erro ao pegar push token', error);
  }
  
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
}

// FUNÇÃO 2: Dispara a notificação para o parceiro
export async function notificarAcao(
  perfilAtual: 'EU' | 'RAY', 
  conta: any, 
  acao: 'adicionou' | 'alterou' | 'removeu' | 'deu baixa em', 
  descricaoTransacao: string
) {
  if (isExpoGo || !Notifications || !conta) return;

  const isComum = conta.tipo === 'COMUM';
  const isCompartilhada = (conta.tipo === 'INDIVIDUAL' || conta.tipo === 'TERCEIROS') && conta.visivelParaParceiro;

  if (!isComum && !isCompartilhada) return;

  const parceiro = perfilAtual === 'EU' ? 'RAY' : 'EU';
  const nomePerfilAtual = perfilAtual === 'RAY' ? 'Thialisson' : 'Rayane';

  try {
    const docSnap = await getDoc(doc(db, 'tokens', parceiro));
    if (!docSnap.exists()) return;

    const tokenParceiro = docSnap.data().token;
    const titulo = `Tabela: ${conta.nome}`;
    const corpo = `${nomePerfilAtual} ${acao} a transação "${descricaoTransacao}".`;

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: tokenParceiro,
        sound: 'default',
        title: titulo,
        body: corpo,
      }),
    });
  } catch (error) {
    console.log('Erro ao enviar notificação', error);
  }
}