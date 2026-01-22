
import React, { useState, useEffect } from 'react';
import { PlusCircle, X, Save, ShoppingBag, Tag, Calendar, Wallet, Landmark, Pencil } from 'lucide-react';
import { Transaction, TransactionType, PaymentStatus, AccountType, ActivityType, Product } from '../types';
import { maskCurrency, parseCurrencyToNumber } from '../utils/format';

interface TransactionFormProps {
  onAdd: (transaction: Omit<Transaction, 'id'>) => void;
  onUpdate?: (id: string, transaction: Omit<Transaction, 'id'>) => void;
  onClose: () => void;
  revenueCategories: string[];
  expenseCategories: string[];
  products: Product[];
  initialData?: Transaction | null;
  selectedYear: number;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ 
  onAdd, onUpdate, onClose, revenueCategories, expenseCategories, products, initialData, selectedYear 
}) => {
  const getDefaultDate = () => {
    const today = new Date();
    if (today.getFullYear() === selectedYear) {
      return today.toISOString().split('T')[0];
    }
    return `${selectedYear}-01-01`;
  };

  const [description, setDescription] = useState('');
  const [amountDisplay, setAmountDisplay] = useState('0,00');
  const [type, setType] = useState<TransactionType>(TransactionType.REVENUE);
  const [date, setDate] = useState(getDefaultDate());
  const [status, setStatus] = useState<PaymentStatus>(PaymentStatus.PAID);
  const [account, setAccount] = useState<AccountType>(AccountType.BANCO);
  const [subcategory, setSubcategory] = useState('');
  const [productId, setProductId] = useState('');

  useEffect(() => {
    if (initialData) {
      setDescription(initialData.description);
      const initialValue = (initialData.amount).toFixed(2).replace(".", ",");
      setAmountDisplay(maskCurrency(initialValue));
      setType(initialData.type);
      setDate(initialData.date);
      setStatus(initialData.status);
      setAccount(initialData.account);
      setSubcategory(initialData.subcategory);
      setProductId(initialData.productId || '');
    }
  }, [initialData]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmountDisplay(maskCurrency(e.target.value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = parseCurrencyToNumber(amountDisplay);
    if (!description || finalAmount <= 0 || !subcategory) return;

    let activityType: ActivityType | undefined = undefined;
    if (type === TransactionType.REVENUE && productId) {
      const prod = products.find(p => p.id === productId);
      activityType = prod?.activityType;
    }

    const data = {
      description,
      amount: finalAmount,
      type,
      date,
      dueDate: date,
      status,
      account,
      subcategory,
      productId: type === TransactionType.REVENUE ? productId : undefined,
      activityType,
      method: 'Pix'
    };

    if (initialData && onUpdate) {
      onUpdate(initialData.id, data);
    } else {
      onAdd(data);
    }
    onClose();
  };

  const categories = type === TransactionType.REVENUE ? revenueCategories : expenseCategories;

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden border-4 border-slate-400">
        <div className="p-8 border-b-4 border-slate-200 flex justify-between items-center bg-slate-50">
           <div>
             <h2 className="text-3xl font-black text-slate-900 tracking-tight">
               {initialData ? 'EDITAR LANÇAMENTO' : 'NOVO REGISTRO'}
             </h2>
             <p className="text-slate-800 font-black text-xs uppercase mt-1 tracking-widest">Fluxo ISEOS Rótulos - Ciclo {selectedYear}</p>
           </div>
           <button onClick={onClose} className="p-4 hover:bg-slate-200 rounded-full transition-all border-2 border-slate-300">
             <X className="w-8 h-8 text-slate-900" />
           </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
           {/* SELETOR DE TIPO COM CONTRASTE REFORÇADO */}
           <div className="flex gap-4 p-2 bg-slate-200 rounded-2xl border-2 border-slate-300">
              <button 
                type="button" 
                onClick={() => {setType(TransactionType.REVENUE); setSubcategory('');}} 
                className={`flex-1 py-5 rounded-xl font-black text-xs uppercase tracking-widest transition-all border-2 ${type === TransactionType.REVENUE ? 'bg-white text-sky-700 shadow-lg border-sky-500 scale-[1.02]' : 'text-slate-600 border-transparent hover:text-slate-900'}`}
              >
                ENTRADA / RECEITA (+)
              </button>
              <button 
                type="button" 
                onClick={() => {setType(TransactionType.EXPENSE); setSubcategory('');}} 
                className={`flex-1 py-5 rounded-xl font-black text-xs uppercase tracking-widest transition-all border-2 ${type === TransactionType.EXPENSE ? 'bg-white text-rose-700 shadow-lg border-rose-500 scale-[1.02]' : 'text-slate-600 border-transparent hover:text-slate-900'}`}
              >
                SAÍDA / DESPESA (-)
              </button>
           </div>

           <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-900 uppercase ml-2 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-sky-600" /> CATEGORIA DO FLUXO
                </label>
                <select 
                  required 
                  value={subcategory} 
                  onChange={(e)=>setSubcategory(e.target.value)} 
                  className="w-full px-6 py-5 bg-white rounded-2xl border-4 border-slate-300 font-black text-slate-900 focus:border-sky-600 outline-none shadow-sm cursor-pointer"
                >
                   <option value="">Selecione uma categoria...</option>
                   {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {type === TransactionType.REVENUE && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <label className="text-xs font-black text-slate-900 uppercase ml-2 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-sky-600" /> ITEM DO CATÁLOGO
                  </label>
                  <select 
                    required 
                    value={productId} 
                    onChange={(e)=>setProductId(e.target.value)} 
                    className="w-full px-6 py-5 bg-sky-50 text-sky-900 rounded-2xl border-4 border-sky-400 font-black focus:border-sky-700 outline-none cursor-pointer"
                  >
                     <option value="">O que você vendeu?</option>
                     {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-900 uppercase ml-2 flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-sky-600" /> DESCRIÇÃO / HISTÓRICO
                </label>
                <input 
                  required 
                  value={description} 
                  onChange={(e)=>setDescription(e.target.value)} 
                  className="w-full px-6 py-5 bg-white rounded-2xl border-4 border-slate-300 font-black text-lg text-slate-900 focus:border-sky-600 outline-none shadow-sm" 
                  placeholder="Ex: NF-e 450 - Cliente Iseos" 
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-xs font-black text-slate-900 uppercase ml-2">VALOR EM REAIS (R$)</label>
                   <input 
                     required 
                     type="text" 
                     value={amountDisplay} 
                     onChange={handleAmountChange} 
                     className={`w-full px-6 py-5 bg-slate-50 rounded-2xl border-4 border-slate-400 font-black text-3xl tabular-nums focus:border-sky-600 outline-none ${type === TransactionType.REVENUE ? 'text-sky-800' : 'text-rose-800'}`} 
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-xs font-black text-slate-900 uppercase ml-2 flex items-center gap-2"><Calendar className="w-5 h-5 text-sky-600" /> DATA DO FATO</label>
                   <input 
                     required 
                     type="date" 
                     value={date} 
                     onChange={(e)=>setDate(e.target.value)} 
                     className="w-full px-6 py-5 bg-white rounded-2xl border-4 border-slate-300 font-black text-lg text-slate-900 focus:border-sky-600 outline-none" 
                   />
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-xs font-black text-slate-900 uppercase ml-2">SITUAÇÃO DO PAGAMENTO</label>
                    <select 
                      value={status} 
                      onChange={(e)=>setStatus(e.target.value as PaymentStatus)} 
                      className="w-full px-6 py-5 bg-white rounded-2xl border-4 border-slate-300 font-black text-slate-900 focus:border-sky-600 outline-none cursor-pointer"
                    >
                        <option value={PaymentStatus.PAID}>CONFIRMADO (LIQUIDADO)</option>
                        <option value={PaymentStatus.PENDING}>PREVISTO (EM ABERTO)</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-black text-slate-900 uppercase ml-2 flex items-center gap-2">CONTA DE ORIGEM/DESTINO</label>
                    <select 
                      value={account} 
                      onChange={(e)=>setAccount(e.target.value as AccountType)} 
                      className="w-full px-6 py-5 bg-white rounded-2xl border-4 border-slate-300 font-black text-slate-900 focus:border-sky-600 outline-none cursor-pointer"
                    >
                        <option value={AccountType.BANCO}>CONTA BANCÁRIA PJ</option>
                        <option value={AccountType.CAIXA}>CAIXA FÍSICO / DINHEIRO</option>
                    </select>
                 </div>
              </div>
           </div>

           <button 
             type="submit" 
             className={`w-full py-8 text-white font-black rounded-3xl shadow-2xl uppercase tracking-[0.2em] text-sm transition-all flex items-center justify-center gap-4 border-4 ${type === TransactionType.REVENUE ? 'bg-sky-700 border-sky-900 hover:bg-sky-800' : 'bg-rose-700 border-rose-900 hover:bg-rose-800'}`}
           >
             {initialData ? <Save className="w-6 h-6" /> : <PlusCircle className="w-6 h-6" />}
             {initialData ? 'SALVAR ALTERAÇÕES AGORA' : 'FINALIZAR REGISTRO AGORA'}
           </button>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
