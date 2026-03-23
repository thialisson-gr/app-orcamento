// services/firebase/firestore.ts
import { addDoc, collection, doc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "./config";

// --- INTERFACES (Definem o formato dos nossos dados) ---

export interface SalvarTransacaoProps {
  tipo: "DESPESA" | "RECEITA";
  valorFormatado: string;
  descricao: string;
  contaSelecionada: string;
  tagSelecionada: string;
  isParcelado: boolean;
  qtdParcelas: string;
  isTerceiro: boolean;
  nomeTerceiro: string;
  dataPagamento?: string; // 👈 Nossa nova propriedade de data
}

export interface SalvarContaProps {
  nome: string;
  tipo: "COMUM" | "INDIVIDUAL" | "TERCEIROS";
  dono?: "EU" | "RAY";
  porcentagemEu: number;
  porcentagemRay: number;
}

// --- FUNÇÕES AUXILIARES ---

// Função nativa para avançar meses sem precisar de bibliotecas pesadas
const avancarMeses = (dataBase: Date, mesesParaAvancar: number) => {
  const novaData = new Date(dataBase);
  novaData.setMonth(novaData.getMonth() + mesesParaAvancar);
  return novaData;
};

// Gerador de ID único simples para agrupar parcelas
const gerarIdUnico = () => {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
};

// --- FUNÇÕES PRINCIPAIS DE SALVAMENTO ---

export async function salvarTransacaoNoFirebase(dados: SalvarTransacaoProps) {
  try {
    // 1. Converter a string "1.500,50" de volta para número (1500.50)
    const valorLimpo = dados.valorFormatado
      .replace(/\./g, "")
      .replace(",", ".");
    const valorNumerico = parseFloat(valorLimpo);

    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      throw new Error("Valor inválido");
    }

    // 2. Lógica do Regime de Caixa (Data da compra vs Data do Pagamento)
    const dataCompra = new Date(); // Dia em que a despesa foi registrada no app
    let dataBasePagamento = new Date(); // Dia do pagamento (padrão é hoje)

    // Se o usuário digitou uma data (Ex: 25/03/2026), nós convertemos para Data Real
    if (dados.dataPagamento && dados.dataPagamento.length === 10) {
      const [dia, mes, ano] = dados.dataPagamento.split("/");
      // O mês no JavaScript começa em 0 (Janeiro = 0), por isso o "- 1"
      dataBasePagamento = new Date(Number(ano), Number(mes) - 1, Number(dia));
    }

    // 3. Se NÃO for parcelado (Compra simples ou Receita)
    if (!dados.isParcelado || dados.tipo === "RECEITA") {
      const novaTransacao = {
        descricao: dados.descricao,
        amount: valorNumerico,
        // Salvamos as duas datas para ter o histórico perfeito
        purchaseDate: dataCompra.toISOString(),
        paymentDate: dataBasePagamento.toISOString(),
        date: dataBasePagamento.toISOString(), // Mantido para compatibilidade com códigos antigos
        accountId: dados.contaSelecionada,
        type: dados.tipo,
        tags: [dados.tagSelecionada],
        isInstallment: false,
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
    }

    // 4. Se FOR PARCELADO (Cria múltiplas despesas de uma vez)
    const numeroParcelas = parseInt(dados.qtdParcelas);
    const valorParcela = valorNumerico / numeroParcelas;
    const parentId = gerarIdUnico(); // ID que liga todas as parcelas da mesma compra

    // O Batch garante que ou salva todas as parcelas, ou nenhuma (evita erros no banco)
    const batch = writeBatch(db);

    for (let i = 0; i < numeroParcelas; i++) {
      // Avança os meses a partir da Data Base de Pagamento
      const dataParcela = avancarMeses(dataBasePagamento, i);

      const novaParcela = {
        descricao: `${dados.descricao} (${i + 1}/${numeroParcelas})`, // Ex: "TV (1/10)"
        amount: valorParcela,
        purchaseDate: dataCompra.toISOString(),
        paymentDate: dataParcela.toISOString(), // O vencimento exato desta parcela específica
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

    await batch.commit();
    return { sucesso: true };
  } catch (erro) {
    console.error("Erro ao salvar no Firebase:", erro);
    return { sucesso: false, erro };
  }
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

    // Salva na coleção "contas"
    await addDoc(collection(db, "contas"), novaConta);
    return { sucesso: true };
  } catch (erro) {
    console.error("Erro ao salvar conta:", erro);
    return { sucesso: false, erro };
  }
}

// Dá baixa em uma única transação
export async function alternarStatusPagamento(
  id: string,
  statusAtual: boolean,
) {
  try {
    const docRef = doc(db, "transacoes", id);
    await updateDoc(docRef, { isPaid: !statusAtual });
    return true;
  } catch (erro) {
    console.error("Erro ao atualizar pagamento:", erro);
    return false;
  }
}

// Dá baixa em todas as transações de uma tabela de uma vez (Pagar Fatura)
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
    console.error("Erro ao pagar fatura:", erro);
    return false;
  }
}
