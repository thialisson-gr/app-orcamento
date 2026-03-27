// hooks/useIdentity.ts
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { auth } from '../services/firebase/config';

export function useIdentity() {
  const [perfil, setPerfil] = useState<"EU" | "RAY" | null>(null);
  const [loadingIdentity, setLoadingIdentity] = useState(true);

  useEffect(() => {
    // O Firebase fica vigiando quem está logado em tempo real
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user?.email) {
        const emailLogado = user.email.toLowerCase();
        
        // Define a lente do aplicativo automaticamente
        if (emailLogado === 'thialissongomes@yahoo.com.br') {
          setPerfil('EU');
        } else if (emailLogado === 'rayaneoceti@gmail.com') {
          setPerfil('RAY');
        } else {
          setPerfil(null); // Bloqueio de segurança para emails não convidados
        }
      } else {
        setPerfil(null);
      }
      setLoadingIdentity(false);
    });

    return () => unsubscribe();
  }, []);

  return { perfil, loadingIdentity };
}