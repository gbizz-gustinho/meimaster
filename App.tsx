
import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, Receipt, Wallet, Calculator, 
  CheckCircle2, Calendar, ShieldCheck, ArrowUpRight, ArrowDownRight,
  DollarSign, Clock, Link as LinkIcon, Trash2, TrendingUp, TrendingDown,
  Landmark, Settings, User, Plus, Info, Download, Upload, AlertCircle, Save,
  ArrowRightLeft, CheckCircle, PlusCircle, Building2, MapPin, Briefcase, X, Eraser, Edit3,
  FileText, ArrowRight, HelpCircle, AlertTriangle, Check, PiggyBank, ChevronRight, ShoppingBag,
  Tag, Pencil, Landmark as BankIcon, Percent, Gavel, FileUp, FileSpreadsheet, Zap, ListTree,
  Globe, Youtube, Twitter, Instagram, Facebook, Share2
} from 'lucide-react';

import { 
  Transaction, TransactionType, PaymentStatus, 
  AccountType, ActivityType, MEIRule, SalaryConfig, CompanyInfo, Product 
} from './types';
import { 
  MEI_RULES as INITIAL_MEI_RULES, 
  SALARY_HISTORY as INITIAL_SALARY_HISTORY,
  REVENUE_SUBCATEGORIES,
  EXPENSE_SUBCATEGORIES,
  INITIAL_PRODUCTS,
  DEFAULT_COMPANY
} from './constants';
import { 
  formatCurrency, formatDate, maskCPF, maskCNPJ, maskCEP, maskCurrency, 
  parseCurrencyToNumber, validateCPF, validateCNPJ 
} from './utils/format';
import SummaryCard from './components/SummaryCard';
import TransactionForm from './components/TransactionForm';

interface BankRecord {
  id: string;
  date: string;
  description: string;
  amount: number;
}

const App: React.FC = () => {
  // --- Estados de Persistência ---
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('mei_master_tx_v5');
    return saved ? JSON.parse(saved) : [];
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('mei_products_v5');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [initialBalances, setInitialBalances] = useState<Record<number, { caixa: number, banco: number }>>(() => {
    const saved = localStorage.getItem('mei_initial_balances_v5');
    return saved ? JSON.parse(saved) : {};
  });

  const [salaryHistory, setSalaryHistory] = useState<SalaryConfig[]>(() => {
    const saved = localStorage.getItem('mei_salary_v5');
    return saved ? JSON.parse(saved) : INITIAL_SALARY_HISTORY;
  });

  const [meiRules, setMeiRules] = useState<Record<string, MEIRule>>(() => {
    const saved = localStorage.getItem('mei_rules_v5');
    return saved ? JSON.parse(saved) : INITIAL_MEI_RULES;
  });

  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(() => {
    const saved = localStorage.getItem('mei_company_v5');
    return saved ? JSON.parse(saved) : {
      ...DEFAULT_COMPANY,
      nomeCivil: '', cpf: '', cnpj: '', dataAbertura: '', nomeEmpresarial: '',
      capitalSocial: '0,00', situacaoCadastral: '', dataSituacao: '', cep: '',
      logradouro: '', numero: '', complemento: '', bairro: '', municipio: '',
      uf: '', formaAtuacao: '', ocupacaoPrincipal: '', cnaePrincipal: '',
      ocupacoesSecundarias: '', cnaeSecundarias: ''
    };
  });

  const [revCats, setRevCats] = useState<string[]>(() => {
    const saved = localStorage.getItem('mei_rev_cats_v5');
    return saved ? JSON.parse(saved) : REVENUE_SUBCATEGORIES;
  });

  const [expCats, setExpCats] = useState<string[]>(() => {
    const saved = localStorage.getItem('mei_exp_cats_v5');
    return saved ? JSON.parse(saved) : EXPENSE_SUBCATEGORIES;
  });

  // --- Estados de UI ---
  const [activeTab, setActiveTab] = useState<'dash' | 'rec_desp' | 'pend' | 'caixa' | 'conciliacao' | 'dirpf' | 'auxiliares' | 'perfil' | 'config' | 'links'>('dash');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [liquidatingTx, setLiquidatingTx] = useState<Transaction | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  
  // Conciliação
  const [importedBankRecords, setImportedBankRecords] = useState<BankRecord[]>([]);
  const [confirmedReconciliations, setConfirmedReconciliations] = useState<string[]>([]);
  
  // Temporários
  const [newCat, setNewCat] = useState('');
  const [newProdName, setNewProdName] = useState('');
  const [newProdActivity, setNewProdActivity] = useState<ActivityType>(ActivityType.SERVICOS);
  const [editInitialCaixa, setEditInitialCaixa] = useState('0,00');
  const [editInitialBanco, setEditInitialBanco] = useState('0,00');

  useEffect(() => { localStorage.setItem('mei_master_tx_v5', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('mei_products_v5', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('mei_initial_balances_v5', JSON.stringify(initialBalances)); }, [initialBalances]);

  const saveAllConfigs = () => {
    localStorage.setItem('mei_salary_v5', JSON.stringify(salaryHistory));
    localStorage.setItem('mei_rules_v5', JSON.stringify(meiRules));
    localStorage.setItem('mei_company_v5', JSON.stringify(companyInfo));
    localStorage.setItem('mei_rev_cats_v5', JSON.stringify(revCats));
    localStorage.setItem('mei_exp_cats_v5', JSON.stringify(expCats));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csvData = event.target?.result as string;
      const lines = csvData.split('\n').filter(line => line.trim() !== '');
      const startIdx = lines[0].toLowerCase().includes('data') || lines[0].toLowerCase().includes('date') ? 1 : 0;
      
      const records: BankRecord[] = lines.slice(startIdx).map(line => {
        const parts = line.split(/[;,]/);
        if (parts.length < 3) return null;
        let rawDate = parts[0].trim().replace(/\//g, '-');
        if (rawDate.split('-')[0].length === 2) {
           const [d, m, y] = rawDate.split('-');
           rawDate = `${y}-${m}-${d}`;
        }
        const description = parts[1].trim();
        const rawAmount = parts[2].trim().replace('R$', '').replace(/\./g, '').replace(',', '.');
        return { id: crypto.randomUUID(), date: rawDate, description, amount: parseFloat(rawAmount) };
      }).filter(r => r !== null && !isNaN(r.amount)) as BankRecord[];
      setImportedBankRecords(records);
      setConfirmedReconciliations([]);
    };
    reader.readAsText(file);
  };

  const handleQuickLaunch = (record: BankRecord) => {
    const isRevenue = record.amount >= 0;
    const newTx: Transaction = {
      id: crypto.randomUUID(),
      description: `[AUTO] ${record.description}`,
      amount: Math.abs(record.amount),
      date: record.date,
      dueDate: record.date,
      type: isRevenue ? TransactionType.REVENUE : TransactionType.EXPENSE,
      status: PaymentStatus.PAID,
      account: AccountType.BANCO,
      subcategory: isRevenue ? revCats[0] : expCats[0],
      method: 'Importação Bancária'
    };
    setTransactions(prev => [newTx, ...prev]);
    setConfirmedReconciliations(prev => [...prev, record.id]);
  };

  const addCategory = (type: TransactionType) => {
    const trimmed = newCat.trim();
    if (!trimmed) return;
    if (type === TransactionType.REVENUE) {
      if (!revCats.includes(trimmed)) setRevCats(prev => [...prev, trimmed]);
    } else {
      if (!expCats.includes(trimmed)) setExpCats(prev => [...prev, trimmed]);
    }
    setNewCat('');
  };

  const renameCategory = (oldName: string, type: TransactionType) => {
    const newName = window.prompt("Digite o novo nome para a categoria:", oldName);
    if (!newName || newName === oldName) return;
    if (type === TransactionType.REVENUE) setRevCats(prev => prev.map(c => c === oldName ? newName : c));
    else setExpCats(prev => prev.map(c => c === oldName ? newName : c));
    setTransactions(prev => prev.map(t => t.subcategory === oldName && t.type === type ? { ...t, subcategory: newName } : t));
  };

  const removeCategory = (cat: string, type: TransactionType) => {
    if (window.confirm(`Excluir a categoria "${cat}"?`)) {
      if (type === TransactionType.REVENUE) setRevCats(prev => prev.filter(c => c !== cat));
      else setExpCats(prev => prev.filter(c => c !== cat));
    }
  };

  const addProduct = () => {
    if (!newProdName.trim()) return;
    setProducts(prev => [...prev, { id: crypto.randomUUID(), name: newProdName.trim(), activityType: newProdActivity }]);
    setNewProdName('');
  };

  const removeProduct = (id: string) => { if (window.confirm("Remover este produto?")) setProducts(prev => prev.filter(p => p.id !== id)); };

  const handleAddTx = (tx: Omit<Transaction, 'id'>) => setTransactions(prev => [{ ...tx, id: crypto.randomUUID() }, ...prev]);
  const handleUpdateTx = (id: string, updatedTx: Omit<Transaction, 'id'>) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...updatedTx, id } : t));
    setEditingTx(null);
  };
  const deleteTx = (id: string) => { if (window.confirm("Deseja excluir este lançamento?")) setTransactions(prev => prev.filter(t => t.id !== id)); };
  
  const handleLiquidate = (id: string, paymentDate: string, method: string) => {
    setTransactions(prev => prev.map(t => t.id === id ? { 
      ...t, 
      status: PaymentStatus.PAID, 
      date: paymentDate, 
      method 
    } : t));
    setLiquidatingTx(null);
  };

  const updateSalaryParam = (year: number, field: keyof SalaryConfig, value: number) => {
    setSalaryHistory(prev => prev.map(s => s.year === year ? { ...s, [field]: value } : s));
  };

  const updateMeiRule = (activity: ActivityType, field: keyof MEIRule, value: number) => {
    setMeiRules(prev => ({ ...prev, [activity]: { ...prev[activity], [field]: value } }));
  };

  const updateInitialBalances = () => {
    setInitialBalances(prev => ({
      ...prev,
      [selectedYear]: { caixa: parseCurrencyToNumber(editInitialCaixa), banco: parseCurrencyToNumber(editInitialBanco) }
    }));
    alert("Saldos iniciais de " + selectedYear + " atualizados com sucesso!");
  };

  const salaryCfg = useMemo(() => 
    salaryHistory.find(s => s.year === selectedYear) || salaryHistory[salaryHistory.length-1]
  , [salaryHistory, selectedYear]);

  const yearTxs = useMemo(() => transactions.filter(t => new Date(t.date).getFullYear() === selectedYear), [transactions, selectedYear]);

  const metrics = useMemo(() => {
    const totalRevenue = yearTxs.filter(t => t.type === TransactionType.REVENUE).reduce((acc, t) => acc + Number(t.amount), 0);
    const totalExpense = yearTxs.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + Number(t.amount), 0);
    const lucroIsento = yearTxs.filter(t => t.type === TransactionType.REVENUE).reduce((acc, t) => {
        const act = t.activityType || ActivityType.SERVICOS;
        const rule = meiRules[act];
        return acc + (Number(t.amount) * (rule?.exemptionPercent || 0));
    }, 0);
    const receitaLiquida = Math.max(0, Number(totalRevenue) - Number(lucroIsento));
    const lucroTributavel = Math.max(0, receitaLiquida - totalExpense);
    const initValCaixa = initialBalances[selectedYear]?.caixa || 0;
    const initValBanco = initialBalances[selectedYear]?.banco || 0;
    const movCaixa = yearTxs.filter(t => t.status === PaymentStatus.PAID && t.account === AccountType.CAIXA).reduce((acc, t) => t.type === TransactionType.REVENUE ? acc + Number(t.amount) : acc - Number(t.amount), 0);
    const movBanco = yearTxs.filter(t => t.status === PaymentStatus.PAID && t.account === AccountType.BANCO).reduce((acc, t) => t.type === TransactionType.REVENUE ? acc + Number(t.amount) : acc - Number(t.amount), 0);
    const revenueByAct = yearTxs.filter(t => t.type === TransactionType.REVENUE).reduce((acc: Record<string, number>, t) => {
        const act = t.activityType || ActivityType.SERVICOS;
        acc[act] = (acc[act] || 0) + Number(t.amount);
        return acc;
    }, {} as Record<string, number>);
    const dominantAct = (Object.entries(revenueByAct) as [string, number][]).sort((a,b) => Number(b[1]) - Number(a[1]))[0]?.[0] as ActivityType || ActivityType.SERVICOS;
    const rule = meiRules[dominantAct];
    const dasValor = (Number(salaryCfg.minWage) * (rule?.inssPercent || 0)) + (rule?.fixedTax || 0);
    const limitMax = dominantAct === ActivityType.TRANSPORTE_CARGAS ? salaryCfg.limitTrucker : salaryCfg.limitStandard;
    return {
      totalRevenue, totalExpense, lucroIsento, receitaLiquida, lucroTributavel,
      saldoCaixa: initValCaixa + movCaixa, saldoBanco: initValBanco + movBanco,
      initCaixa: initValCaixa, initBanco: initValBanco, movCaixa, movBanco,
      dasValor, dominantAct, limitMax, limitUsage: (Number(totalRevenue) / Number(limitMax)) * 100,
      dominantExemption: (rule?.exemptionPercent || 0) * 100,
      dominantActivity: dominantAct
    };
  }, [yearTxs, meiRules, salaryCfg, initialBalances, selectedYear]);

  const reconciliationData = useMemo(() => {
    return importedBankRecords.map(record => {
      const match = yearTxs.find(t => t.account === AccountType.BANCO && Math.abs(t.amount) === Math.abs(record.amount) && (t.date === record.date || t.description.includes(record.description.slice(0, 5))));
      const isConfirmed = confirmedReconciliations.includes(record.id);
      return { ...record, match, isMatched: !!match, isConfirmed };
    });
  }, [importedBankRecords, yearTxs, confirmedReconciliations]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">
      <aside className="hidden md:flex w-72 flex-col bg-white border-r border-slate-300 p-6 sticky top-0 h-screen overflow-y-auto z-50">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="p-3 bg-sky-600 rounded-xl shadow-lg border-2 border-sky-900"><ShieldCheck className="w-6 h-6 text-white" /></div>
          <div><span className="text-lg font-black tracking-tighter uppercase leading-none block">ISEOS Master</span><span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-1 block">Gestão Senior</span></div>
        </div>
        <div className="mb-8 p-5 bg-slate-100 rounded-2xl border-2 border-slate-300">
          <span className="text-[11px] font-black uppercase tracking-widest block mb-3 ml-1 flex items-center gap-2"><Pencil className="w-3.5 h-3.5 text-sky-600" /> Ano Fiscal</span>
          <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="w-full bg-white px-4 py-3 rounded-xl border-2 border-slate-400 font-black text-sky-700 outline-none">
            {[...salaryHistory].reverse().map(s => <option key={s.year} value={s.year}>{s.year}</option>)}
          </select>
        </div>
        <nav className="space-y-1 flex-1">
          <MenuBtn active={activeTab === 'dash'} onClick={() => setActiveTab('dash')} icon={LayoutDashboard} label="Dashboard" />
          <MenuBtn active={activeTab === 'rec_desp'} onClick={() => setActiveTab('rec_desp')} icon={Receipt} label="Receitas e Despesas" />
          <MenuBtn active={activeTab === 'pend'} onClick={() => setActiveTab('pend')} icon={Clock} label="Contas a Pagar/Rec" />
          <MenuBtn active={activeTab === 'caixa'} onClick={() => setActiveTab('caixa')} icon={Landmark} label="Caixa e Bancos" />
          <MenuBtn active={activeTab === 'conciliacao'} onClick={() => setActiveTab('conciliacao')} icon={ArrowRightLeft} label="Conciliação" />
          <MenuBtn active={activeTab === 'dirpf'} onClick={() => setActiveTab('dirpf')} icon={FileText} label="Apuração DIRPF" />
          <div className="h-px bg-slate-300 my-4 mx-2" />
          <MenuBtn active={activeTab === 'links'} onClick={() => setActiveTab('links')} icon={Share2} label="Links e Apoio" />
          <MenuBtn active={activeTab === 'auxiliares'} onClick={() => setActiveTab('auxiliares')} icon={ListTree} label="Tabelas Auxiliares" />
          <MenuBtn active={activeTab === 'perfil'} onClick={() => setActiveTab('perfil')} icon={Building2} label="Perfil Empresa" />
          <MenuBtn active={activeTab === 'config'} onClick={() => setActiveTab('config')} icon={Settings} label="Parâmetros Fiscais" />
        </nav>
      </aside>

      <main className="flex-1 p-6 md:p-10 pb-32 max-w-7xl mx-auto w-full">
        <header className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-4"><div className="h-10 w-2 bg-sky-600 rounded-full" /><h1 className="text-3xl font-black uppercase tracking-tight">
            {activeTab === 'dash' && "Visão do Negócio"}
            {activeTab === 'rec_desp' && "Movimento Operacional"}
            {activeTab === 'pend' && "Contas a Pagar e a Receber"}
            {activeTab === 'caixa' && "Disponibilidades Reais"}
            {activeTab === 'conciliacao' && "Checklist de Conciliação"}
            {activeTab === 'dirpf' && "Apuração de Lucro Fiscal"}
            {activeTab === 'links' && "Links Úteis e Social"}
            {activeTab === 'auxiliares' && "Cadastros Auxiliares"}
            {activeTab === 'perfil' && "Dados Cadastrais"}
            {activeTab === 'config' && "Regras do Sistema"}
          </h1></div>
          {activeTab === 'rec_desp' && <button onClick={() => setShowAddModal(true)} className="flex items-center gap-3 px-8 py-4 bg-sky-700 text-white font-black rounded-xl shadow-lg border-2 border-sky-900 uppercase text-xs tracking-widest"><Plus className="w-5 h-5" /> Novo Registro</button>}
        </header>

        {activeTab === 'dash' && (
          <div className="space-y-10 animate-in fade-in">
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <SummaryCard title="Receita Bruta" value={metrics.totalRevenue} icon={ArrowUpRight} colorClass="bg-sky-600" subtitle="Entradas" />
              <SummaryCard title="Despesas Totais" value={metrics.totalExpense} icon={ArrowDownRight} colorClass="bg-rose-600" subtitle="Saídas" />
              <SummaryCard title="Lucro Isento" value={metrics.lucroIsento} icon={ShieldCheck} colorClass="bg-sky-600" subtitle="Isenção" />
              <SummaryCard title="Base Tributável" value={metrics.lucroTributavel} icon={Calculator} colorClass="bg-amber-600" subtitle="DIRPF" />
            </div>
            <div className="bg-white p-10 rounded-[2rem] border-2 border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="font-black text-slate-900 uppercase text-xs flex items-center gap-2"><TrendingUp className="w-5 h-5 text-sky-600" /> Saúde do Faturamento</h3>
                  <span className="font-black text-xs bg-slate-100 px-4 py-2 rounded-lg border-2 border-slate-300">Teto: {formatCurrency(metrics.limitMax)}</span>
                </div>
                <div className="h-10 bg-slate-100 rounded-full border-2 border-slate-300 p-1.5"><div className={`h-full rounded-full transition-all duration-1000 ${metrics.limitUsage > 100 ? 'bg-rose-600' : 'bg-sky-600'}`} style={{ width: `${Math.min(100, metrics.limitUsage)}%` }} /></div>
                <p className={`text-6xl font-black tracking-tighter mt-4 ${metrics.limitUsage > 100 ? 'text-rose-700' : 'text-slate-900'}`}>{metrics.limitUsage.toFixed(1)}%</p>
            </div>
          </div>
        )}

        {activeTab === 'rec_desp' && (
           <div className="bg-white rounded-[2rem] border-2 border-slate-300 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead className="bg-slate-100 text-xs font-black uppercase text-slate-900 border-b-2 border-slate-300"><tr><th className="px-6 py-5">Data</th><th className="px-6 py-5">Descrição</th><th className="px-6 py-5">Categoria</th><th className="px-6 py-5 text-right">Valor</th><th className="px-6 py-5 text-center">Status</th><th className="px-6 py-5 text-center">Ações</th></tr></thead>
                   <tbody className="divide-y divide-slate-200">{yearTxs.map(t => (
                      <tr key={t.id} className={`hover:bg-slate-50 transition-all ${t.type === TransactionType.REVENUE ? 'bg-sky-50/20' : 'bg-rose-50/20'}`}>
                        <td className="px-6 py-6 font-bold">{formatDate(t.date)}</td>
                        <td className="px-6 py-6"><p className="font-black text-lg">{t.description}</p></td>
                        <td className="px-6 py-6"><span className={`text-[10px] font-black px-3 py-1 rounded-lg border-2 uppercase ${t.type === TransactionType.REVENUE ? 'bg-sky-100 text-sky-900 border-sky-400' : 'bg-rose-100 text-rose-900 border-rose-400'}`}>{t.subcategory}</span></td>
                        <td className={`px-6 py-6 text-right font-black text-2xl ${t.type === TransactionType.REVENUE ? 'text-sky-700' : 'text-rose-700'}`}>{t.type === TransactionType.REVENUE ? '+' : '-'} {formatCurrency(t.amount)}</td>
                        <td className="px-6 py-6 text-center">
                           <span className={`text-[9px] font-black px-2 py-1 rounded uppercase border ${t.status === PaymentStatus.PAID ? 'bg-emerald-100 text-emerald-800 border-emerald-400' : 'bg-amber-100 text-amber-800 border-amber-400'}`}>
                              {t.status === PaymentStatus.PAID ? 'Liquidado' : 'Aberto'}
                           </span>
                        </td>
                        <td className="px-6 py-6"><div className="flex justify-center gap-2"><button onClick={()=>setEditingTx(t)} className="p-2 bg-sky-600 text-white rounded-lg"><Edit3 className="w-4 h-4" /></button><button onClick={()=>deleteTx(t.id)} className="p-2 bg-rose-600 text-white rounded-lg"><Trash2 className="w-4 h-4" /></button></div></td>
                      </tr>
                   ))}</tbody>
                </table>
              </div>
           </div>
        )}

        {activeTab === 'pend' && (
           <div className="space-y-10 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="bg-white p-10 rounded-[2.5rem] border-l-[15px] border-sky-600 shadow-sm border border-slate-300">
                    <p className="text-xs font-black uppercase mb-2 tracking-widest text-slate-600">Total a Receber (Contas a Receber)</p>
                    <p className="text-5xl font-black text-sky-700">{formatCurrency(yearTxs.filter(t=>t.type===TransactionType.REVENUE && t.status===PaymentStatus.PENDING).reduce((acc,t)=>acc+Number(t.amount),0))}</p>
                 </div>
                 <div className="bg-white p-10 rounded-[2.5rem] border-l-[15px] border-rose-600 shadow-sm border border-slate-300">
                    <p className="text-xs font-black uppercase mb-2 tracking-widest text-slate-600">Total a Pagar (Contas a Pagar)</p>
                    <p className="text-5xl font-black text-rose-700">{formatCurrency(yearTxs.filter(t=>t.type===TransactionType.EXPENSE && t.status===PaymentStatus.PENDING).reduce((acc,t)=>acc+Number(t.amount),0))}</p>
                 </div>
              </div>
              <div className="bg-white rounded-[2rem] border-2 border-slate-300 shadow-sm overflow-hidden">
                 <h3 className="px-6 py-6 font-black text-slate-900 uppercase text-xs bg-slate-100 border-b-2 border-slate-300 flex items-center gap-3"><Clock className="w-6 h-6 text-amber-600" /> Títulos Pendentes de Baixa</h3>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-700 border-b"><tr><th className="px-6 py-4">Data Venc.</th><th className="px-6 py-4">Descrição do Título</th><th className="px-6 py-4">Categoria</th><th className="px-6 py-4 text-right">Valor</th><th className="px-6 py-4 text-center">Ação</th></tr></thead>
                       <tbody className="divide-y divide-slate-200">{yearTxs.filter(t=>t.status===PaymentStatus.PENDING).map(t=>(
                          <tr key={t.id} className="hover:bg-slate-50 transition-all">
                             <td className="px-6 py-6 font-bold text-sm text-slate-600">{formatDate(t.date)}</td>
                             <td className="px-6 py-6"><p className="font-black text-slate-900 text-lg">{t.description}</p></td>
                             <td className="px-6 py-6"><span className={`text-[10px] font-black px-2 py-1 rounded border ${t.type === TransactionType.REVENUE ? 'border-sky-300 text-sky-700 bg-sky-50' : 'border-rose-300 text-rose-700 bg-rose-50'}`}>{t.subcategory}</span></td>
                             <td className={`px-6 py-6 text-right font-black text-2xl ${t.type===TransactionType.REVENUE ? 'text-sky-700':'text-rose-700'}`}>{formatCurrency(t.amount)}</td>
                             <td className="px-6 py-6 text-center"><button onClick={()=>setLiquidatingTx(t)} className="px-8 py-3.5 bg-sky-700 text-white font-black text-[10px] uppercase rounded-xl border-2 border-sky-900 shadow-lg hover:bg-sky-800 transition-all">EFETUAR BAIXA DO TÍTULO</button></td>
                          </tr>
                       ))}
                       {yearTxs.filter(t=>t.status===PaymentStatus.PENDING).length === 0 && (
                          <tr><td colSpan={5} className="px-6 py-20 text-center font-black text-slate-400 uppercase tracking-widest">Nenhum título pendente para este ano fiscal.</td></tr>
                       )}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'caixa' && (
           <div className="space-y-10 animate-in fade-in">
              <div className="bg-white p-10 rounded-[2.5rem] border-2 border-slate-300 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8">
                 <div className="flex items-center gap-5"><div className="p-5 bg-sky-100 rounded-2xl border-2 border-sky-300"><PiggyBank className="w-12 h-12 text-sky-700" /></div><div><h3 className="font-black text-xl uppercase leading-none">Abertura de Saldos</h3><p className="text-slate-600 font-bold text-[11px] uppercase mt-2">Informe os saldos reais em 01 de Janeiro de {selectedYear}</p></div></div>
                 <div className="flex gap-4 w-full md:w-auto">
                    <div className="flex-1 space-y-1"><label className="text-[10px] font-black uppercase ml-2 text-slate-500">Saldo Banco PJ</label><input value={editInitialBanco} onChange={(e)=>setEditInitialBanco(maskCurrency(e.target.value))} className="w-full px-5 py-4 border-2 border-slate-400 rounded-2xl font-black text-sky-800 text-xl" /></div>
                    <div className="flex-1 space-y-1"><label className="text-[10px] font-black uppercase ml-2 text-slate-500">Saldo Caixa Físico</label><input value={editInitialCaixa} onChange={(e)=>setEditInitialCaixa(maskCurrency(e.target.value))} className="w-full px-5 py-4 border-2 border-slate-400 rounded-2xl font-black text-sky-700 text-xl" /></div>
                    <button onClick={updateInitialBalances} className="bg-sky-700 p-5 rounded-2xl text-white self-end transition-all border-2 border-sky-900 shadow-lg hover:bg-sky-800"><Check className="w-8 h-8" /></button>
                 </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <BalanceCard label="Saldo Banco PJ" total={metrics.saldoBanco} init={metrics.initBanco} mov={metrics.movBanco} icon={BankIcon} color="sky" />
                 <BalanceCard label="Saldo Caixa Físico" total={metrics.saldoCaixa} init={metrics.initCaixa} mov={metrics.movCaixa} icon={Wallet} color="emerald" />
              </div>
           </div>
        )}

        {activeTab === 'conciliacao' && (
           <div className="space-y-10 animate-in fade-in">
              <div className="bg-sky-50 border-2 border-sky-200 p-8 rounded-[2rem] flex gap-6 items-start">
                 <div className="p-3 bg-white rounded-xl shadow-sm border border-sky-100"><Info className="w-8 h-8 text-sky-600" /></div>
                 <div className="space-y-2">
                    <h3 className="font-black uppercase text-sky-900 text-sm tracking-widest">Orientações para Conciliação Bancária</h3>
                    <p className="text-slate-700 text-sm leading-relaxed font-medium">A conciliação permite confrontar seu extrato real com os lançamentos do sistema. Importe o arquivo <span className="font-black">CSV</span> do seu banco e o sistema tentará localizar correspondências automáticas baseadas em data e valor. Registros confirmados garantem que sua <span className="font-black text-sky-700">Disponibilidade Bancária</span> esteja correta.</p>
                 </div>
              </div>
              <div className="bg-white p-12 rounded-[2.5rem] border-4 border-dashed border-slate-300 hover:border-sky-500 transition-all text-center relative overflow-hidden group cursor-pointer">
                 <input type="file" accept=".csv" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                 <div className="space-y-4"><FileUp className="w-12 h-12 text-slate-400 group-hover:text-sky-600 mx-auto" /><h3 className="text-xl font-black uppercase tracking-tighter">Carregar Extrato Bancário (.CSV)</h3><p className="text-xs font-bold text-slate-500 uppercase">Selecione o arquivo do seu banco para conciliar</p></div>
              </div>
              {reconciliationData.length > 0 && (
                <div className="bg-white rounded-[2rem] border-2 border-slate-300 shadow-sm overflow-hidden">
                   <div className="px-8 py-6 bg-slate-100 border-b-2 border-slate-300 flex justify-between items-center"><h3 className="font-black uppercase text-xs">Comparativo Extrato vs Sistema</h3><button onClick={()=>setImportedBankRecords([])} className="text-xs font-black text-rose-600 uppercase">Limpar Checklist</button></div>
                   <div className="overflow-x-auto"><table className="w-full text-left">
                     <thead className="bg-slate-50 text-[10px] font-black uppercase"><tr><th className="px-8 py-4">Item no Extrato</th><th className="px-8 py-4">Status</th><th className="px-8 py-4 text-center">Marcação</th><th className="px-8 py-4 text-center">Ação</th></tr></thead>
                     <tbody className="divide-y divide-slate-100">{reconciliationData.map((rec) => (
                        <tr key={rec.id} className={`hover:bg-slate-50 transition-all ${rec.isConfirmed ? 'bg-emerald-50/50' : (rec.isMatched ? 'bg-amber-50/30' : 'bg-rose-50/10')}`}>
                           <td className="px-8 py-6"><p className="text-sm font-black text-slate-900">{rec.description}</p><span className="text-[10px] font-bold text-slate-500">{formatDate(rec.date)} | {formatCurrency(rec.amount)}</span></td>
                           <td className="px-8 py-6 border-x border-slate-100">{rec.isMatched ? <div className="p-2 border-2 border-amber-300 rounded-lg text-xs font-bold text-amber-800">Encontrado no App: {rec.match?.description}</div> : <div className="p-2 border-2 border-rose-200 rounded-lg text-xs font-bold text-rose-800">Lançamento não encontrado</div>}</td>
                           <td className="px-8 py-6 text-center">{rec.isConfirmed ? <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" /> : rec.isMatched ? <button onClick={()=>setConfirmedReconciliations(prev=>[...prev, rec.id])} className="px-4 py-2 border-2 border-amber-500 text-amber-600 rounded-lg text-[10px] font-black uppercase hover:bg-amber-500 hover:text-white transition-all">MARCAR CONCILIADO</button> : "-"}</td>
                           <td className="px-8 py-6 text-center">{!rec.isMatched && !rec.isConfirmed && <button onClick={()=>handleQuickLaunch(rec)} className="flex items-center gap-2 px-6 py-3 bg-sky-700 text-white font-black text-[10px] uppercase rounded-xl border-2 border-sky-900 shadow-lg hover:scale-105 transition-all"><Zap className="w-4 h-4 fill-current" /> LANÇAR AGORA</button>}</td>
                        </tr>
                     ))}</tbody>
                   </table></div>
                </div>
              )}
           </div>
        )}

        {activeTab === 'dirpf' && (
           <div className="space-y-10 animate-in fade-in">
              <div className="bg-sky-900 p-10 rounded-[2.5rem] border-4 border-sky-700 shadow-2xl relative overflow-hidden">
                 <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="space-y-4">
                       <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Apuração Anual DIRPF {selectedYear}</h3>
                       <p className="text-sky-200 font-bold text-sm max-w-xl leading-relaxed">Este módulo calcula automaticamente a parcela isenta e a parcela tributável do seu lucro como MEI, baseando-se nas regras de presunção da Receita Federal.</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm p-6 rounded-3xl border border-white/20 text-center">
                       <p className="text-sky-300 text-[10px] font-black uppercase mb-1 tracking-widest">Atividade Dominante</p>
                       <p className="text-white font-black text-xl uppercase">{metrics.dominantActivity}</p>
                       <div className="h-1 bg-white/20 my-3" />
                       <p className="text-sky-300 text-[10px] font-black uppercase mb-1 tracking-widest">Percentual de Isenção</p>
                       <p className="text-white font-black text-3xl">{metrics.dominantExemption}%</p>
                    </div>
                 </div>
                 <div className="absolute -right-10 -bottom-10 w-64 h-64 text-white/5 opacity-20 pointer-events-none"><Calculator className="w-full h-full" /></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <div className="bg-white p-8 rounded-[2rem] border-2 border-slate-200">
                    <p className="text-[10px] font-black uppercase text-slate-500 mb-3 tracking-widest">Receita Bruta Total</p>
                    <p className="text-3xl font-black text-slate-900">{formatCurrency(metrics.totalRevenue)}</p>
                 </div>
                 <div className="bg-white p-8 rounded-[2rem] border-2 border-emerald-500 bg-emerald-50/20">
                    <p className="text-[10px] font-black uppercase text-emerald-600 mb-3 tracking-widest">Lucro Isento (Presumido)</p>
                    <p className="text-3xl font-black text-emerald-700">{formatCurrency(metrics.lucroIsento)}</p>
                 </div>
                 <div className="bg-white p-8 rounded-[2rem] border-2 border-rose-200 bg-rose-50/20">
                    <p className="text-[10px] font-black uppercase text-rose-600 mb-3 tracking-widest">Despesas do Negócio</p>
                    <p className="text-3xl font-black text-rose-700">{formatCurrency(metrics.totalExpense)}</p>
                 </div>
                 <div className="bg-white p-8 rounded-[2rem] border-4 border-amber-500 bg-amber-50 shadow-lg">
                    <p className="text-[10px] font-black uppercase text-amber-600 mb-3 tracking-widest">Base Tributável (Líquida)</p>
                    <p className="text-3xl font-black text-amber-700">{formatCurrency(metrics.lucroTributavel)}</p>
                 </div>
              </div>

              <div className="bg-white p-10 rounded-[2.5rem] border-2 border-slate-300 shadow-sm space-y-8">
                 <h3 className="text-xl font-black uppercase flex items-center gap-3"><HelpCircle className="w-8 h-8 text-sky-600" /> Como declarar esses valores no software da RFB?</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-8 bg-emerald-50 rounded-3xl border-2 border-emerald-100 space-y-4">
                       <div className="flex items-center gap-3 mb-2"><CheckCircle className="w-6 h-6 text-emerald-600" /><p className="font-black text-emerald-900 uppercase text-xs">Rendimentos Isentos e Não Tributáveis</p></div>
                       <p className="text-sm text-emerald-800 leading-relaxed">No software IRPF, acesse a ficha <span className="font-bold">"Rendimentos Isentos e Não Tributáveis"</span>, escolha o código <span className="font-bold">"13 - Rendimento de sócio ou titular de microempresa ou empresa de pequeno porte optante pelo Simples Nacional"</span> e informe o valor de <span className="font-black text-lg">{formatCurrency(metrics.lucroIsento)}</span>.</p>
                    </div>
                    <div className="p-8 bg-amber-50 rounded-3xl border-2 border-amber-100 space-y-4">
                       <div className="flex items-center gap-3 mb-2"><AlertTriangle className="w-6 h-6 text-amber-600" /><p className="font-black text-amber-900 uppercase text-xs">Rendimentos Tributáveis Recebidos de PJ</p></div>
                       <p className="text-sm text-amber-800 leading-relaxed">Acesse a ficha <span className="font-bold">"Rendimentos Tributáveis Recebidos de PJ"</span> e informe o valor de <span className="font-black text-lg">{formatCurrency(metrics.lucroTributavel)}</span> como rendimento recebido do seu próprio CNPJ. Se este valor for superior ao limite de isenção anual da RFB (aprox. R$ 30.639,90), você poderá ter imposto a pagar.</p>
                    </div>
                 </div>
                 <div className="p-6 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 text-center">
                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Nota: Consulte sempre um contador para validação final do preenchimento da sua declaração de ajuste anual.</p>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'links' && (
           <div className="space-y-12 animate-in fade-in">
              <div className="bg-white p-10 rounded-[2.5rem] border-2 border-slate-300 shadow-sm space-y-10">
                 <h3 className="text-xl font-black uppercase flex items-center gap-3 tracking-tighter"><Globe className="w-8 h-8 text-sky-700" /> Canais Oficiais do Governo</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ExternalLinkCard 
                      label="Portal do Empreendedor" 
                      url="https://www.gov.br/empresas-e-negocios/pt-br/empreendedor" 
                      description="Informações gerais, abertura e alteração do MEI."
                      icon={Globe}
                    />
                    <ExternalLinkCard 
                      label="DASN-SIMEI (Declaração Anual)" 
                      url="https://www8.receita.fazenda.gov.br/SimplesNacional/Aplicacoes/ATSPO/dasnsimei.app/Identificacao" 
                      description="Entrega da declaração anual de faturamento."
                      icon={FileText}
                    />
                    <ExternalLinkCard 
                      label="Emissor de NFS-e Nacional" 
                      url="https://www.nfse.gov.br/EmissorNacional/Login" 
                      description="Emissão gratuita de notas fiscais eletrônicas."
                      icon={Zap}
                    />
                    <ExternalLinkCard 
                      label="PGMEI (Emissão de DAS)" 
                      url="https://www8.receita.fazenda.gov.br/SimplesNacional/Aplicacoes/ATSPO/pgmei.app/Identificacao" 
                      description="Geração e pagamento das guias mensais de impostos."
                      icon={DollarSign}
                    />
                 </div>
              </div>

              <div className="bg-white p-10 rounded-[2.5rem] border-2 border-slate-300 shadow-sm space-y-10">
                 <h3 className="text-xl font-black uppercase flex items-center gap-3 tracking-tighter"><Share2 className="w-8 h-8 text-sky-700" /> Siga a MEI x PJ</h3>
                 <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <SocialButton url="https://www.youtube.com/@meixpj" icon={Youtube} label="YouTube" color="bg-[#FF0000]" />
                    <SocialButton url="https://x.com/meixpj" icon={Twitter} label="Twitter / X" color="bg-[#000000]" />
                    <SocialButton url="https://www.instagram.com/meix.pj/" icon={Instagram} label="Instagram" color="bg-[#E4405F]" />
                    <SocialButton url="https://br.pinterest.com/meixpj/" icon={Share2} label="Pinterest" color="bg-[#BD081C]" />
                    <SocialButton url="https://www.facebook.com/xmei.pj" icon={Facebook} label="Facebook" color="bg-[#1877F2]" />
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'auxiliares' && (
           <div className="space-y-12 animate-in fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                 <div className="bg-white p-10 rounded-[2.5rem] border-2 border-slate-300 shadow-sm space-y-8">
                    <h3 className="text-lg font-black uppercase flex items-center gap-3"><TrendingUp className="w-6 h-6 text-sky-600" /> Categorias de Receitas</h3>
                    <div className="flex flex-wrap gap-2">{revCats.map(c => <CatTag key={c} label={c} onRemove={() => removeCategory(c, TransactionType.REVENUE)} onRename={() => renameCategory(c, TransactionType.REVENUE)} />)}</div>
                    <div className="flex gap-2"><input value={newCat} onChange={(e)=>setNewCat(e.target.value)} className="flex-1 px-5 py-3 border-2 border-slate-300 rounded-xl font-bold" placeholder="Nova categoria de receita..." /><button onClick={()=>addCategory(TransactionType.REVENUE)} className="bg-sky-700 text-white p-4 rounded-xl shadow-lg hover:bg-sky-800 border-2 border-sky-900"><Plus/></button></div>
                 </div>
                 <div className="bg-white p-10 rounded-[2.5rem] border-2 border-slate-300 shadow-sm space-y-8">
                    <h3 className="text-lg font-black uppercase flex items-center gap-3"><TrendingDown className="w-6 h-6 text-rose-600" /> Categorias de Despesas</h3>
                    <div className="flex flex-wrap gap-2">{expCats.map(c => <CatTag key={c} label={c} onRemove={() => removeCategory(c, TransactionType.EXPENSE)} onRename={() => renameCategory(c, TransactionType.EXPENSE)} />)}</div>
                    <div className="flex gap-2"><input value={newCat} onChange={(e)=>setNewCat(e.target.value)} className="flex-1 px-5 py-3 border-2 border-slate-300 rounded-xl font-bold" placeholder="Nova categoria de despesa..." /><button onClick={()=>addCategory(TransactionType.EXPENSE)} className="bg-rose-700 text-white p-4 rounded-xl shadow-lg hover:bg-rose-800 border-2 border-rose-900"><Plus/></button></div>
                 </div>
              </div>
              <div className="bg-white p-10 rounded-[2.5rem] border-2 border-slate-300 shadow-sm space-y-10">
                 <h3 className="text-xl font-black uppercase flex items-center gap-3"><ShoppingBag className="w-8 h-8 text-sky-700" /> Catálogo de Produtos e Serviços</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-8 bg-slate-50 border-4 border-dashed border-slate-300 rounded-3xl space-y-4">
                       <p className="text-[10px] font-black uppercase text-slate-500 text-center">Adicionar Novo Item</p>
                       <input value={newProdName} onChange={(e)=>setNewProdName(e.target.value)} placeholder="Nome do item..." className="w-full px-4 py-3 border-2 rounded-xl font-bold" />
                       <select value={newProdActivity} onChange={(e)=>setNewProdActivity(e.target.value as ActivityType)} className="w-full px-4 py-3 border-2 rounded-xl font-bold">{Object.values(ActivityType).map(a=><option key={a} value={a}>{a}</option>)}</select>
                       <button onClick={addProduct} className="w-full bg-slate-900 text-white py-3 rounded-xl font-black uppercase text-xs tracking-widest border-2 border-black hover:bg-black transition-all">Adicionar ao Catálogo</button>
                    </div>
                    {products.map(p => (
                       <div key={p.id} className="p-8 bg-white border-2 border-slate-300 rounded-3xl relative group hover:border-sky-500 transition-all shadow-sm">
                          <button onClick={()=>removeProduct(p.id)} className="absolute top-4 right-4 text-rose-600 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-5 h-5"/></button>
                          <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center mb-4 border border-sky-200"><Tag className="w-6 h-6 text-sky-600" /></div>
                          <p className="font-black uppercase text-slate-900 text-lg leading-tight">{p.name}</p>
                          <p className="text-[9px] font-black text-sky-700 bg-sky-50 px-2 py-1 rounded-lg border border-sky-100 inline-block mt-3 uppercase tracking-wider">{p.activityType}</p>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'perfil' && (
          <div className="bg-white p-10 rounded-[2.5rem] border-2 border-slate-300 shadow-sm space-y-10 animate-in fade-in">
             <div className="flex justify-between items-center"><h3 className="text-2xl font-black uppercase flex items-center gap-4"><Building2 className="w-8 h-8 text-sky-700" /> Cadastro Empresarial MEI</h3><button onClick={saveAllConfigs} className="px-10 py-5 bg-sky-700 text-white font-black rounded-xl border-2 border-sky-900 shadow-xl hover:scale-105 transition-all">SALVAR DADOS</button></div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <ProfileField label="Razão Social" value={companyInfo.nomeEmpresarial} onChange={(v:any)=>setCompanyInfo({...companyInfo, nomeEmpresarial:v})} />
                <ProfileField label="CNPJ" value={companyInfo.cnpj} error={companyInfo.cnpj && !validateCNPJ(companyInfo.cnpj) ? "CNPJ Inválido" : ""} onChange={(v:any)=>setCompanyInfo({...companyInfo, cnpj:maskCNPJ(v)})} />
                <ProfileField label="Nome Civil" value={companyInfo.nomeCivil} onChange={(v:any)=>setCompanyInfo({...companyInfo, nomeCivil:v})} />
                <ProfileField label="CPF" value={companyInfo.cpf} error={companyInfo.cpf && !validateCPF(companyInfo.cpf) ? "CPF Inválido" : ""} onChange={(v:any)=>setCompanyInfo({...companyInfo, cpf:maskCPF(v)})} />
                <ProfileField label="Capital Social" value={companyInfo.capitalSocial} onChange={(v:any)=>setCompanyInfo({...companyInfo, capitalSocial:maskCurrency(v)})} />
                <ProfileField label="CEP" value={companyInfo.cep} onChange={(v:any)=>setCompanyInfo({...companyInfo, cep:maskCEP(v)})} />
             </div>
          </div>
        )}

        {activeTab === 'config' && (
          <div className="space-y-10 animate-in fade-in">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="bg-white p-10 rounded-[2.5rem] border-2 border-slate-300 shadow-sm space-y-6">
                   <h3 className="text-lg font-black uppercase border-b-2 pb-4 flex items-center gap-2"><Gavel className="w-6 h-6 text-sky-600" /> Limites e Salários de {selectedYear}</h3>
                   <div className="space-y-5">
                      <div className="flex justify-between items-center"><span className="text-xs font-black uppercase text-slate-600">Salário Mínimo Vigente</span><input type="number" value={salaryCfg.minWage} onChange={(e)=>updateSalaryParam(selectedYear, 'minWage', Number(e.target.value))} className="w-40 border-2 rounded-lg px-4 py-2 font-black text-sky-700" /></div>
                      <div className="flex justify-between items-center"><span className="text-xs font-black uppercase text-slate-600">Teto Faturamento (Geral)</span><input type="number" value={salaryCfg.limitStandard} onChange={(e)=>updateSalaryParam(selectedYear, 'limitStandard', Number(e.target.value))} className="w-40 border-2 rounded-lg px-4 py-2 font-black text-sky-700" /></div>
                      <div className="flex justify-between items-center"><span className="text-xs font-black uppercase text-slate-600">Teto Caminhoneiro</span><input type="number" value={salaryCfg.limitTrucker} onChange={(e)=>updateSalaryParam(selectedYear, 'limitTrucker', Number(e.target.value))} className="w-40 border-2 rounded-lg px-4 py-2 font-black text-sky-700" /></div>
                   </div>
                </div>
                <div className="bg-white p-10 rounded-[2.5rem] border-2 border-slate-300 shadow-sm space-y-4">
                   <h3 className="text-lg font-black uppercase border-b-2 pb-4 flex items-center gap-2"><Percent className="w-6 h-6 text-sky-600" /> Alíquotas por Atividade</h3>
                   <div className="overflow-x-auto">
                    <table className="w-full text-[10px] font-black uppercase text-slate-700">
                        <thead><tr className="border-b"><th>Atividade</th><th className="text-center">INSS %</th><th className="text-center">Taxa R$</th><th className="text-center">Isenção %</th></tr></thead>
                        <tbody className="divide-y divide-slate-100">{Object.values(ActivityType).map(act=>(
                          <tr key={act}>
                            <td className="py-3 font-bold">{act}</td>
                            <td className="text-center"><input value={meiRules[act].inssPercent} onChange={(e)=>updateMeiRule(act, 'inssPercent', Number(e.target.value))} className="w-14 border-2 rounded p-1 text-center font-black"/></td>
                            <td className="text-center"><input value={meiRules[act].fixedTax} onChange={(e)=>updateMeiRule(act, 'fixedTax', Number(e.target.value))} className="w-14 border-2 rounded p-1 text-center font-black"/></td>
                            <td className="text-center"><input value={meiRules[act].exemptionPercent} onChange={(e)=>updateMeiRule(act, 'exemptionPercent', Number(e.target.value))} className="w-14 border-2 rounded p-1 text-center font-black"/></td>
                          </tr>
                        ))}</tbody>
                    </table>
                   </div>
                </div>
             </div>
             <button onClick={saveAllConfigs} className="w-full py-6 bg-sky-700 text-white font-black rounded-2xl uppercase tracking-[0.3em] shadow-xl border-2 border-sky-900 hover:bg-sky-800 transition-all">GRAVAR TODOS OS PARÂMETROS FISCAIS</button>
          </div>
        )}
      </main>

      {(showAddModal || editingTx) && (
        <TransactionForm 
          onAdd={handleAddTx} onUpdate={handleUpdateTx} initialData={editingTx} products={products}
          selectedYear={selectedYear} onClose={()=>{setShowAddModal(false); setEditingTx(null);}} 
          revenueCategories={revCats} expenseCategories={expCats} 
        />
      )}

      {liquidatingTx && (
        <LiquidationModal 
          transaction={liquidatingTx}
          onConfirm={handleLiquidate}
          onClose={() => setLiquidatingTx(null)}
        />
      )}
    </div>
  );
};

// --- COMPONENTES AUXILIARES PARA A NOVA ABA ---

const ExternalLinkCard = ({ label, url, description, icon: Icon }: any) => (
  <a href={url} target="_blank" rel="noopener noreferrer" className="p-8 bg-slate-50 border-2 border-slate-200 rounded-3xl group hover:border-sky-500 transition-all shadow-sm flex flex-col items-center text-center">
    <div className="p-4 bg-white rounded-2xl border-2 border-slate-100 mb-6 group-hover:scale-110 transition-transform">
      <Icon className="w-8 h-8 text-sky-700" />
    </div>
    <h4 className="font-black text-slate-900 uppercase text-xs mb-3 tracking-widest">{label}</h4>
    <p className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed">{description}</p>
    <div className="mt-6 flex items-center gap-2 text-[9px] font-black text-sky-700 uppercase tracking-widest">
       Acessar Portal <ArrowRight className="w-3 h-3" />
    </div>
  </a>
);

const SocialButton = ({ url, icon: Icon, label, color }: any) => (
  <a href={url} target="_blank" rel="noopener noreferrer" className={`p-4 ${color} rounded-2xl text-white flex flex-col items-center gap-2 border-4 border-black/10 hover:scale-105 transition-all shadow-lg`}>
    <Icon className="w-6 h-6" />
    <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
  </a>
);

// --- COMPONENTES AUXILIARES EXISTENTES ---

interface LiquidationModalProps {
  transaction: Transaction;
  onConfirm: (id: string, paymentDate: string, method: string) => void;
  onClose: () => void;
}

const LiquidationModal: React.FC<LiquidationModalProps> = ({ transaction, onConfirm, onClose }) => {
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payMethod, setPayMethod] = useState(transaction.method || 'Pix');

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center z-[110] p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden border-4 border-slate-400">
        <div className="p-8 border-b-2 border-slate-200 bg-slate-50 flex justify-between items-center">
           <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase">Liquidar Título</h2>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Confirmar recebimento ou pagamento real</p>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-all border border-slate-300">
             <X className="w-6 h-6 text-slate-900" />
           </button>
        </div>
        
        <div className="p-8 space-y-8">
           <div className="p-6 bg-slate-50 border-2 border-slate-200 rounded-2xl">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Resumo do Lançamento</p>
              <p className="font-black text-slate-900 text-xl uppercase leading-tight mb-2">{transaction.description}</p>
              <p className={`text-2xl font-black ${transaction.type === TransactionType.REVENUE ? 'text-sky-700' : 'text-rose-700'}`}>
                {formatCurrency(transaction.amount)}
              </p>
           </div>

           <div className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[11px] font-black text-slate-900 uppercase tracking-widest ml-2 flex items-center gap-2">
                   <Calendar className="w-4 h-4 text-sky-600" /> Data Efetiva do Pagamento
                 </label>
                 <input 
                   type="date" 
                   value={payDate} 
                   onChange={(e) => setPayDate(e.target.value)}
                   className="w-full px-6 py-4 bg-white border-2 border-slate-300 rounded-xl font-black text-slate-900 focus:border-sky-600 outline-none"
                 />
              </div>

              <div className="space-y-2">
                 <label className="text-[11px] font-black text-slate-900 uppercase tracking-widest ml-2 flex items-center gap-2">
                   <Wallet className="w-4 h-4 text-sky-600" /> Método de Pagamento Utilizado
                 </label>
                 <select 
                   value={payMethod}
                   onChange={(e) => setPayMethod(e.target.value)}
                   className="w-full px-6 py-4 bg-white border-2 border-slate-300 rounded-xl font-black text-slate-900 focus:border-sky-600 outline-none cursor-pointer"
                 >
                    <option value="Pix">Pix</option>
                    <option value="Boleto">Boleto</option>
                    <option value="Transferência (TED/DOC)">Transferência (TED/DOC)</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Outros">Outros</option>
                 </select>
              </div>
           </div>

           <button 
             onClick={() => onConfirm(transaction.id, payDate, payMethod)}
             className="w-full py-6 bg-sky-700 text-white font-black rounded-2xl border-4 border-sky-900 shadow-xl uppercase tracking-widest hover:bg-sky-800 transition-all flex items-center justify-center gap-4"
           >
             <CheckCircle className="w-6 h-6" /> EFETUAR BAIXA AGORA
           </button>
        </div>
      </div>
    </div>
  );
};

const MenuBtn = ({ active, onClick, icon: Icon, label }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl font-black transition-all group border-2 ${active ? 'bg-sky-700 text-white border-sky-900 shadow-xl scale-[1.03]' : 'text-slate-800 border-transparent hover:bg-slate-200 hover:text-slate-900 hover:border-slate-300'}`}>
    <Icon className={`w-6 h-6 ${active ? 'text-white' : 'text-slate-600 group-hover:text-sky-700'}`} />
    <span className="text-[12px] uppercase tracking-widest font-black leading-none">{label}</span>
  </button>
);

const CatTag = ({ label, onRemove, onRename }: any) => (
  <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-[10px] font-black uppercase shadow-sm hover:border-sky-400 transition-all">
    <span className="text-slate-800">{label}</span>
    <div className="flex gap-2 ml-3 border-l pl-3 border-slate-200">
      <button onClick={onRename} className="p-1 hover:text-sky-600 transition-colors"><Pencil className="w-3.5 h-3.5"/></button>
      <button onClick={onRemove} className="p-1 hover:text-rose-600 transition-colors"><X className="w-3.5 h-3.5"/></button>
    </div>
  </div>
);

const BalanceCard = ({ label, total, init, mov, icon: Icon, color }: any) => (
  <div className={`bg-white p-10 rounded-[2.5rem] border-2 border-slate-300 shadow-sm relative overflow-hidden group hover:border-${color}-500 transition-all`}>
    <div className="relative z-10">
      <div className="flex items-center gap-4 mb-8">
        <div className={`p-4 rounded-2xl bg-${color}-100 border-2 border-${color}-300`}>
          <Icon className={`w-8 h-8 text-${color}-700`} />
        </div>
        <h3 className="font-black uppercase text-xs text-slate-600 tracking-widest">{label}</h3>
      </div>
      <p className={`text-6xl font-black tracking-tighter mb-8 tabular-nums ${total >= 0 ? 'text-slate-900' : 'text-rose-700'}`}>{formatCurrency(total)}</p>
      <div className="border-t-2 border-slate-100 pt-6 flex justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[9px] font-black uppercase text-slate-500">Saldo Abertura</p>
          <p className="text-xs font-black text-slate-900 tabular-nums">{formatCurrency(init)}</p>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-[9px] font-black uppercase text-slate-500">Movimentação Acumulada</p>
          <p className={`text-xs font-black tabular-nums ${mov >= 0 ? 'text-sky-700' : 'text-rose-700'}`}>{mov >= 0 ? '+' : ''} {formatCurrency(mov)}</p>
        </div>
      </div>
    </div>
  </div>
);

const ProfileField = ({ label, value, onChange, error }: any) => (
  <div className="space-y-3">
    <label className="text-[11px] font-black uppercase ml-4 text-slate-800 tracking-widest flex items-center gap-2"><Pencil className="w-4 h-4 text-sky-600" /> {label}</label>
    <div className="relative">
      <input 
        value={value} 
        onChange={(e)=>onChange(e.target.value)} 
        className={`w-full px-8 py-5 bg-white border-4 rounded-[1.8rem] font-black text-xl shadow-sm outline-none transition-all ${error ? 'border-rose-500 bg-rose-50 text-rose-900' : 'border-slate-300 focus:border-sky-600 focus:bg-sky-50 text-slate-900'}`} 
      />
      {error && <span className="absolute -bottom-6 left-6 text-[10px] font-black text-rose-600 uppercase animate-in slide-in-from-top-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {error}</span>}
    </div>
  </div>
);

export default App;
