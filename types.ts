
export enum ActivityType {
  COMERCIO = 'COMÉRCIO',
  INDUSTRIA = 'INDÚSTRIA',
  SERVICOS = 'SERVIÇOS',
  TRANSPORTE_PASSAGEIROS = 'TRANSPORTE DE PASSAGEIROS',
  TRANSPORTE_CARGAS = 'TRANSPORTE DE CARGAS'
}

export enum TransactionType {
  REVENUE = 'revenue',
  EXPENSE = 'expense'
}

export enum PaymentStatus {
  PAID = 'paid',
  PENDING = 'pending'
}

export enum AccountType {
  CAIXA = 'caixa',
  BANCO = 'banco'
}

export interface Product {
  id: string;
  name: string;
  activityType: ActivityType;
  defaultPrice?: number;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  dueDate: string;
  type: TransactionType;
  status: PaymentStatus;
  account: AccountType;
  subcategory: string;
  productId?: string;
  activityType?: ActivityType;
  method: string;
}

export interface MEIRule {
  activity: ActivityType;
  exemptionPercent: number;
  inssPercent: number;
  fixedTax: number;
}

export interface SalaryConfig {
  year: number;
  minWage: number;
  limitStandard: number; 
  limitTrucker: number;
  monthlyProLabore: number;
}

export interface CompanyInfo {
  nomeCivil: string;
  cpf: string;
  cnpj: string;
  dataAbertura: string;
  nomeEmpresarial: string;
  capitalSocial: string;
  situacaoCadastral: string;
  dataSituacao: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  uf: string;
  formaAtuacao: string;
  ocupacaoPrincipal: string;
  cnaePrincipal: string;
  ocupacoesSecundarias: string;
  cnaeSecundarias: string;
}
