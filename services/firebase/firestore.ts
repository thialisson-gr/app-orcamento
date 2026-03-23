// services/firebase/firestore.ts
import { addMonths } from "date-fns";
import { addDoc, collection, doc, writeBatch } from "firebase/firestore";
import uuid from "react-native-uuid";
import { db } from "./config";

interface SalvarTransacaoProps {
  tipo: "DESPESA" | "RECEITA";
  valorFormatado: string;
  descricao: string;
  contaSelecionada: string;
  tagSelecionada: string;
  isParcelado: boolean;
  qtdParcelas: string;
  isTerceiro: boolean;
  nomeTerceiro: string;
}

export async function salvarTransacaoNoFirebase(dados: SalvarTransacaoProps) {
  try {
    // 1. Converter a string "1.500,50" de volta para número (1500.50)
    // Removemos os pontos e trocamos a vírgula por ponto
    const valorLimpo = dados.valorFormatado
      .replace(/\./g, "")
      .replace(",", ".");
    const valorNumerico = parseFloat(valorLimpo);

    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      throw new Error("Valor inválido");
    }

    const dataAtual = new Date();

    // 2. Se NÃO for parcelado (Compra simples ou Receita)
    if (!dados.isParcelado || dados.tipo === "RECEITA") {
      const novaTransacao = {
        descricao: dados.descricao,
        amount: valorNumerico,
        date: dataAtual.toISOString(),
        accountId: dados.contaSelecionada,
        type: dados.tipo,
        tags: [dados.tagSelecionada],
        isInstallment: false,
        isForThirdParty: dados.isTerceiro,
        // Adiciona dados do terceiro apenas se a chave estiver ativa
        ...(dados.isTerceiro && {
          thirdPartyDetails: {
            debtorName: dados.nomeTerceiro,
            status: "PENDING",
          },
        }),
      };

      // Salva um único documento na coleção "transacoes"
      await addDoc(collection(db, "transacoes"), novaTransacao);
      return { sucesso: true };
    }

    // 3. Se FOR PARCELADO (Criar múltiplos documentos de uma vez)
    const numeroParcelas = parseInt(dados.qtdParcelas);
    const valorParcela = valorNumerico / numeroParcelas;
    const parentId = uuid.v4() as string; // ID único que liga todas as parcelas

    // O Batch garante que ou salva todas as parcelas, ou não salva nenhuma (evita erros)
    const batch = writeBatch(db);

    for (let i = 0; i < numeroParcelas; i++) {
      // Avança os meses conforme a parcela (Parcela 1 = mês atual, Parcela 2 = mês que vem...)
      const dataParcela = addMonths(dataAtual, i);

      const novaParcela = {
        descricao: `${dados.descricao} (${i + 1}/${numeroParcelas})`, // Ex: "TV (1/12)"
        amount: valorParcela,
        date: dataParcela.toISOString(),
        accountId: dados.contaSelecionada,
        type: dados.tipo,
        tags: [dados.tagSelecionada],
        isInstallment: true,
        installmentDetails: { parentId, current: i + 1, total: numeroParcelas },
        isForThirdParty: dados.isTerceiro,
        ...(dados.isTerceiro && {
          thirdPartyDetails: {
            debtorName: dados.nomeTerceiro,
            status: "PENDING",
          },
        }),
      };

      const docRef = doc(collection(db, "transacoes"));
      batch.set(docRef, novaParcela);
    }

    await batch.commit(); // Dispara o salvamento de todas as parcelas no Firebase
    return { sucesso: true };
  } catch (erro) {
    console.error("Erro ao salvar no Firebase:", erro);
    return { sucesso: false, erro };
  }
}

// Adicione isso no final do arquivo services/firebase/firestore.ts

interface SalvarContaProps {
  nome: string;
  tipo: "COMUM" | "INDIVIDUAL" | "TERCEIROS";
  dono?: "EU" | "RAY"; // Apenas para contas individuais
  porcentagemEu: number;
  porcentagemRay: number;
}

export async function salvarContaNoFirebase(dados: SalvarContaProps) {
  try {
    const novaConta = {
      nome: dados.nome,
      tipo: dados.tipo,
      dono: dados.dono || null,
      splitRule: {
        me: dados.porcentagemEu,
        spouse: dados.porcentagemRay,
      },
      createdAt: new Date().toISOString(),
    };

    // Salva na nova coleção "contas"
    await addDoc(collection(db, "contas"), novaConta);
    return { sucesso: true };
  } catch (erro) {
    console.error("Erro ao salvar conta:", erro);
    return { sucesso: false, erro };
  }
}
