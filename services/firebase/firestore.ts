// services/firebase/firestore.ts
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "./config";

export interface SalvarTransacaoProps {
  tipo: "DESPESA" | "RECEITA";
  valorFormatado: string;
  descricao: string;
  contaSelecionada: string;
  tagSelecionada: string;
  isParcelado: boolean;
  qtdParcelas: string;
  isFixo: boolean;
  mesesProjecao: string;
  isTerceiro: boolean;
  nomeTerceiro: string;
  dataPagamento?: string;
}

export interface SalvarContaProps {
  nome: string;
  tipo: "COMUM" | "INDIVIDUAL" | "TERCEIROS";
  dono?: "EU" | "RAY";
  porcentagemEu: number;
  porcentagemRay: number;
}

const avancarMeses = (dataBase: Date, mesesParaAvancar: number) => {
  const novaData = new Date(dataBase);
  novaData.setMonth(novaData.getMonth() + mesesParaAvancar);
  return novaData;
};

const gerarIdUnico = () => {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
};

export async function salvarTransacaoNoFirebase(dados: SalvarTransacaoProps) {
  try {
    const valorLimpo = dados.valorFormatado
      .replace(/\./g, "")
      .replace(",", ".");
    const valorNumerico = parseFloat(valorLimpo);

    if (isNaN(valorNumerico) || valorNumerico <= 0)
      throw new Error("Valor inválido");

    const dataCompra = new Date();
    let dataBasePagamento = new Date();

    if (dados.dataPagamento && dados.dataPagamento.length === 10) {
      const [dia, mes, ano] = dados.dataPagamento.split("/");
      dataBasePagamento = new Date(Number(ano), Number(mes) - 1, Number(dia));
    }

    if (dados.isParcelado && dados.tipo === "DESPESA") {
      const numeroParcelas = parseInt(dados.qtdParcelas);
      const valorParcela = valorNumerico / numeroParcelas;
      const parentId = gerarIdUnico();
      const batch = writeBatch(db);

      for (let i = 0; i < numeroParcelas; i++) {
        const dataParcela = avancarMeses(dataBasePagamento, i);
        const novaParcela = {
          descricao: `${dados.descricao} (${i + 1}/${numeroParcelas})`,
          amount: valorParcela,
          purchaseDate: dataCompra.toISOString(),
          paymentDate: dataParcela.toISOString(),
          date: dataParcela.toISOString(),
          accountId: dados.contaSelecionada,
          type: dados.tipo,
          tags: [dados.tagSelecionada],
          isInstallment: true,
          installmentDetails: {
            parentId,
            current: i + 1,
            total: numeroParcelas,
          },
          isPaid: false, // Nasce Pendente
          isForThirdParty: dados.isTerceiro,
          ...(dados.isTerceiro && {
            thirdPartyDetails: {
              debtorName: dados.nomeTerceiro,
              status: "PENDING",
            },
          }),
        };
        batch.set(doc(collection(db, "transacoes")), novaParcela);
      }
      await batch.commit();
      return { sucesso: true };
    }

    if (dados.isFixo) {
      const numeroMeses = parseInt(dados.mesesProjecao) || 12;
      const parentId = gerarIdUnico(); // 👈 Agrupador para Contas Fixas
      const batch = writeBatch(db);

      for (let i = 0; i < numeroMeses; i++) {
        const dataProjecao = avancarMeses(dataBasePagamento, i);
        const novaTransacaoFixa = {
          descricao: dados.descricao,
          amount: valorNumerico,
          purchaseDate: dataCompra.toISOString(),
          paymentDate: dataProjecao.toISOString(),
          date: dataProjecao.toISOString(),
          accountId: dados.contaSelecionada,
          type: dados.tipo,
          tags: [dados.tagSelecionada],
          isInstallment: false,
          isFixed: true,
          fixedDetails: { parentId, current: i + 1, total: numeroMeses }, // 👈 Salva o agrupador no banco
          isPaid: false, // 👈 RECEITAS E DESPESAS NASCEM PENDENTES AGORA
          isForThirdParty: dados.isTerceiro,
          ...(dados.isTerceiro && {
            thirdPartyDetails: {
              debtorName: dados.nomeTerceiro,
              status: "PENDING",
            },
          }),
        };
        batch.set(doc(collection(db, "transacoes")), novaTransacaoFixa);
      }
      await batch.commit();
      return { sucesso: true };
    }

    const novaTransacao = {
      descricao: dados.descricao,
      amount: valorNumerico,
      purchaseDate: dataCompra.toISOString(),
      paymentDate: dataBasePagamento.toISOString(),
      date: dataBasePagamento.toISOString(),
      accountId: dados.contaSelecionada,
      type: dados.tipo,
      tags: [dados.tagSelecionada],
      isInstallment: false,
      isFixed: false,
      isPaid: false, // 👈 TUDO NASCE PENDENTE
      isForThirdParty: dados.isTerceiro,
      ...(dados.isTerceiro && {
        thirdPartyDetails: {
          debtorName: dados.nomeTerceiro,
          status: "PENDING",
        },
      }),
    };
    await addDoc(collection(db, "transacoes"), novaTransacao);
    return { sucesso: true };
  } catch (erro) {
    console.error("Erro ao guardar no Firebase:", erro);
    return { sucesso: false, erro };
  }
}

export async function salvarContaNoFirebase(dados: SalvarContaProps) {
  try {
    const novaConta = {
      nome: dados.nome,
      tipo: dados.tipo,
      dono: dados.dono || null,
      splitRule: { me: dados.porcentagemEu, spouse: dados.porcentagemRay },
      createdAt: new Date().toISOString(),
    };
    await addDoc(collection(db, "contas"), novaConta);
    return { sucesso: true };
  } catch (erro) {
    return { sucesso: false, erro };
  }
}

export async function alternarStatusPagamento(
  id: string,
  statusAtual: boolean,
) {
  try {
    const docRef = doc(db, "transacoes", id);
    await updateDoc(docRef, { isPaid: !statusAtual });
    return true;
  } catch (erro) {
    return false;
  }
}

export async function pagarFaturaCompleta(transacoesIds: string[]) {
  try {
    const batch = writeBatch(db);
    transacoesIds.forEach((id) => {
      const docRef = doc(db, "transacoes", id);
      batch.update(docRef, { isPaid: true });
    });
    await batch.commit();
    return true;
  } catch (erro) {
    return false;
  }
}

export async function deletarTransacaoDoFirebase(id: string) {
  try {
    const docRef = doc(db, "transacoes", id);
    await deleteDoc(docRef);
    return true;
  } catch (erro) {
    return false;
  }
}

export async function deletarContaNoFirebase(id: string) {
  try {
    const docRef = doc(db, "contas", id);
    await deleteDoc(docRef);
    return true;
  } catch (erro) {
    console.error("Erro ao apagar conta:", erro);
    return false;
  }
}

export async function atualizarContaNoFirebase(
  id: string,
  nomeAntigo: string,
  dados: any,
) {
  try {
    const batch = writeBatch(db);

    // 1. Atualiza os dados da Conta
    const contaRef = doc(db, "contas", id);
    batch.update(contaRef, {
      nome: dados.nome,
      tipo: dados.tipo,
      dono: dados.dono || null,
      splitRule: { me: dados.porcentagemEu, spouse: dados.porcentagemRay },
    });

    // 2. Se você mudou o nome da tabela, ele atualiza todas as transações antigas!
    if (nomeAntigo !== dados.nome) {
      const q = query(
        collection(db, "transacoes"),
        where("accountId", "==", nomeAntigo),
      );
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((documento) => {
        batch.update(doc(db, "transacoes", documento.id), {
          accountId: dados.nome,
        });
      });
    }

    await batch.commit();
    return { sucesso: true };
  } catch (erro) {
    console.error("Erro ao atualizar conta:", erro);
    return { sucesso: false, erro };
  }
}
