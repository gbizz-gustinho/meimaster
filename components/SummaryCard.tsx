
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { formatCurrency } from '../utils/format';

interface SummaryCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  colorClass: string;
  subtitle?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon: Icon, colorClass, subtitle }) => {
  const isSky = colorClass.includes('sky');
  const isRose = colorClass.includes('rose');
  const valueColor = isSky ? 'text-sky-800' : isRose ? 'text-rose-800' : 'text-slate-900';

  return (
    <div className="bg-white rounded-[2rem] p-8 shadow-sm border-2 border-slate-200 transition-all hover:shadow-md hover:border-slate-300">
      <div className="flex items-center justify-between mb-6">
        <div className={`p-4 rounded-2xl ${colorClass} bg-opacity-10 text-opacity-100 border border-current/10`}>
          <Icon className={`w-8 h-8 ${isSky ? 'text-sky-700' : isRose ? 'text-rose-700' : 'text-slate-800'}`} />
        </div>
        {subtitle && <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-lg border border-slate-300">{subtitle}</span>}
      </div>
      <h3 className="text-slate-900 text-[11px] font-black uppercase tracking-widest mb-2 border-l-4 border-slate-300 pl-3">{title}</h3>
      <p className={`text-3xl font-black tabular-nums tracking-tighter ${valueColor}`}>
        {formatCurrency(value)}
      </p>
    </div>
  );
};

export default SummaryCard;
