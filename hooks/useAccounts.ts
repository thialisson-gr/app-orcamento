// hooks/useAccounts.ts
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../services/firebase/config";

export function useAccounts() {
  const [contas, setContas] = useState<any[]>([]);
  const [loadingContas, setLoadingContas] = useState(true);

  useEffect(() => {
    // Busca as contas ordenadas pela data de criação
    const q = query(collection(db, "contas"), orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dados = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setContas(dados);
      setLoadingContas(false);
    });

    return () => unsubscribe();
  }, []);

  return { contas, loadingContas };
}
