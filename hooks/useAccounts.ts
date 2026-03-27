// hooks/useAccounts.ts
import { collection, onSnapshot, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../services/firebase/config"; // 👈 Ajustado o caminho!
import { useIdentity } from "./useIdentity"; // 👈 Importamos o Cérebro de Identidade!

export function useAccounts() {
  const [contas, setContas] = useState<any[]>([]);
  const [loadingContas, setLoadingContas] = useState(true);
  
  // Pergunta pro app: Quem está segurando esse celular? ("EU" ou "RAY")
  const { perfil, loadingIdentity } = useIdentity(); 

  useEffect(() => {
    // Se ainda está descobrindo quem é o usuário, não faz nada
    if (loadingIdentity) return;

    const q = query(collection(db, "contas"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const listaContas: any[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();

        // 🛡️ REGRAS DO MODO BANCO (A Separação Absoluta)
        // Se a conta for INDIVIDUAL e tiver um dono registrado:
        if (data.tipo === "INDIVIDUAL" && data.dono) {
          
          // Só mostra se o dono da conta for a mesma pessoa segurando o celular
          if (data.dono === perfil) {
            listaContas.push({ id: doc.id, ...data });
          }
          // Se for do outro, ela simplesmente não existe pra esse celular!
          
        } else {
          // Contas do tipo COMUM, TERCEIROS, RECEITA, ou contas muito antigas sem dono:
          // Ambos podem ver e interagir.
          listaContas.push({ id: doc.id, ...data });
        }
      });

      setContas(listaContas);
      setLoadingContas(false);
    });

    return () => unsubscribe();
  }, [perfil, loadingIdentity]);

  return { contas, loadingContas: loadingContas || loadingIdentity };
}