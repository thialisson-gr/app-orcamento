// types/index.ts

// 1. Tipagem das Contas/Cartões
export interface Account {
  id: string;
  name: string; // Ex: "Nubank Casal", "Santander Ray"
  type: "CREDIT_CARD" | "CHECKING_ACCOUNT" | "CASH";
  // A regra de divisão (Ex: me: 67, spouse: 33)
  splitRule: {
    me: number; // Porcentagem que você paga
    spouse: number; // Porcentagem que a Ray paga
  };
}

// 2. Tipagem para Compras de Terceiros
export interface ThirdPartyDetails {
  debtorName: string; // Ex: "João"
  status: "PENDING" | "PAID";
}

// 3. Tipagem para Parcelamentos
export interface InstallmentDetails {
  parentId: string; // ID único que liga todas as parcelas
  current: number; // Ex: Parcela 2
  total: number; // Ex: de 12
}

// 4. Tipagem Principal: A Transação (Despesa ou Receita)
export interface Transaction {
  id: string;
  description: string; // Ex: "Supermercado" ou "TV da Sala"
  amount: number; // Valor (Ex: 150.50)
  date: Date | string; // Data da compra
  accountId: string; // Em qual cartão/conta foi pago
  type: "INCOME" | "EXPENSE"; // Receita ou Despesa
  tags: string[]; // Ex: ["Alimentação", "Casa"]

  // Nossas regras especiais (opcionais, pois nem toda compra tem)
  isInstallment: boolean;
  installmentDetails?: InstallmentDetails;

  isForThirdParty: boolean;
  thirdPartyDetails?: ThirdPartyDetails;
}
