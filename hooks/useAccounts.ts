// hooks/useAccounts.ts
import { collection, onSnapshot, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../services/firebase/config";
import { useIdentity } from "./useIdentity";

export function useAccounts() {
  const [contas, setContas] = useState<any[]>([]);
  const [loadingContas, setLoadingContas] = useState(true);
  
  const { perfil, loadingIdentity } = useIdentity(); 

  useEffect(() => {
    if (loadingIdentity) return;

    const q = query(collection(db, "contas"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const listaContas: any[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();

        // 🛡️ REGRA DE NEGÓCIOS DE PRIVACIDADE FLEXÍVEL:
        if (data.tipo === "INDIVIDUAL" || data.tipo === "TERCEIROS" || data.tipo === "RECEITA") {
          
          // A conta entra na lista se: 
          // 1. O usuário logado é o dono dela OR
          // 2. O dono marcou explicitamente que ela é visível para o parceiro
          if (data.dono === perfil || data.visivelParaParceiro === true) {
            listaContas.push({ id: doc.id, ...data });
          }
          
        } else {
          // Apenas contas do tipo COMUM passam direto para os dois verem e interagirem
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