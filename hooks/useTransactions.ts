// hooks/useTransactions.ts
import { collection, onSnapshot, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../services/firebase/config";
import { useAccounts } from "./useAccounts"; // 👈 Importamos o leitor de contas!

export function useTransactions() {
  const [todasTransacoes, setTodasTransacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Vamos buscar a lista de contas que este utilizador tem permissão para ver
  const { contas, loadingContas } = useAccounts();

  useEffect(() => {
    const q = query(collection(db, "transacoes"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const lista: any[] = [];
      querySnapshot.forEach((doc) => {
        lista.push({ id: doc.id, ...doc.data() });
      });

      setTodasTransacoes(lista);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // O FILTRO DE SEGURANÇA DEFINITIVO:
  // O utilizador só pode ver as transações que pertencem às tabelas a que ele tem acesso.
  const nomesContasVisiveis = contas.map((c) => c.nome);
  const transacoes = todasTransacoes.filter((t) =>
    nomesContasVisiveis.includes(t.accountId),
  );

  // Só dizemos que terminou de carregar quando as duas coisas estiverem prontas
  const isLoadingGeral = loading || loadingContas;

  return { transacoes, loading: isLoadingGeral };
}
