
import { ActivityType, MEIRule, SalaryConfig, Product } from './types';

export const MEI_RULES: Record<string, MEIRule> = {
  [ActivityType.COMERCIO]: {
    activity: ActivityType.COMERCIO,
    exemptionPercent: 0.08,
    inssPercent: 0.05,
    fixedTax: 1.00 
  },
  [ActivityType.INDUSTRIA]: {
    activity: ActivityType.INDUSTRIA,
    exemptionPercent: 0.08,
    inssPercent: 0.05,
    fixedTax: 1.00 
  },
  [ActivityType.SERVICOS]: {
    activity: ActivityType.SERVICOS,
    exemptionPercent: 0.32,
    inssPercent: 0.05,
    fixedTax: 5.00 
  },
  [ActivityType.TRANSPORTE_PASSAGEIROS]: {
    activity: ActivityType.TRANSPORTE_PASSAGEIROS,
    exemptionPercent: 0.16,
    inssPercent: 0.05,
    fixedTax: 5.00 
  },
  [ActivityType.TRANSPORTE_CARGAS]: {
    activity: ActivityType.TRANSPORTE_CARGAS,
    exemptionPercent: 0.08,
    inssPercent: 0.12,
    fixedTax: 5.00 
  }
};

export const SALARY_HISTORY: SalaryConfig[] = [
  { year: 2020, minWage: 1045, limitStandard: 81000, limitTrucker: 251600, monthlyProLabore: 1045 },
  { year: 2021, minWage: 1100, limitStandard: 81000, limitTrucker: 251600, monthlyProLabore: 1100 },
  { year: 2022, minWage: 1212, limitStandard: 81000, limitTrucker: 251600, monthlyProLabore: 1212 },
  { year: 2023, minWage: 1320, limitStandard: 81000, limitTrucker: 251600, monthlyProLabore: 1320 },
  { year: 2024, minWage: 1412, limitStandard: 81000, limitTrucker: 251600, monthlyProLabore: 1412 },
  { year: 2025, minWage: 1518, limitStandard: 81000, limitTrucker: 251600, monthlyProLabore: 1518 }
];

export const REVENUE_SUBCATEGORIES = [
  "Vendas Diretas", "Serviços Recorrentes", "Projetos Avulsos", "Royalties", "Outras Receitas"
];

export const EXPENSE_SUBCATEGORIES = [
  "Insumos e Materiais", "Aluguel", "Energia/Água", "Internet/Telefone", 
  "DAS-MEI", "Material de Escritório", "Pró-labore", "Marketing", "Outras Despesas"
];

export const INITIAL_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Consultoria Técnica', activityType: ActivityType.SERVICOS },
  { id: 'p2', name: 'Venda de Produto Acabado', activityType: ActivityType.COMERCIO },
  { id: 'p3', name: 'Manutenção de Equipamentos', activityType: ActivityType.SERVICOS }
];

export const DEFAULT_COMPANY = {
  name: "MINHA EMPRESA MEI LTDA",
  cnpj: "00.000.000/0001-00",
  cpf: "000.000.000-00",
  openingDate: "2020-01-01",
  address: "Rua Principal, 123",
  city: "Sua Cidade",
  uf: "UF"
};
