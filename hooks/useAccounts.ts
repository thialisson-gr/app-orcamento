// hooks/useAccounts.ts
import { collection, onSnapshot, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { auth, db } from "../services/firebase/config";

export function useAccounts() {
  const [contas, setContas] = useState<any[]>([]);
  const [loadingContas, setLoadingContas] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "contas"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const listaContas: any[] = [];
      const currentUserUid = auth.currentUser?.uid;

      querySnapshot.forEach((doc) => {
        const data = doc.data();

        // REGRAS DE VISIBILIDADE (A Mágica da Separação):
        // 1. É uma conta comum? Todo a gente vê.
        const isComum = data.tipo === "COMUM";
        // 2. Fui eu que criei (Carimbo de Dono)? Eu vejo.
        const isDono = data.userId === currentUserUid;
        // 3. Foi criada antes de termos a regra de dono? Mostra para não perdermos o histórico antigo.
        const isAntiga = !data.userId;

        // Se passar nalguma destas regras, a tabela aparece para o utilizador!
        if (isComum || isDono || isAntiga) {
          listaContas.push({ id: doc.id, ...data });
        }
      });

      setContas(listaContas);
      setLoadingContas(false);
    });

    return () => unsubscribe();
  }, []);

  return { contas, loadingContas };
}
