// hooks/useTransactions.ts
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../services/firebase/config";

export function useTransactions() {
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cria uma "query" (consulta) pedindo as transações ordenadas pela data mais recente
    const q = query(collection(db, "transacoes"), orderBy("date", "desc"));

    // O onSnapshot fica "escutando" o banco em tempo real
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dados = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setTransacoes(dados);
      setLoading(false);
    });

    // Se a tela for fechada, ele para de escutar para economizar bateria e internet
    return () => unsubscribe();
  }, []);

  return { transacoes, loading };
}
