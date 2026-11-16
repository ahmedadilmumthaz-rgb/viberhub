import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon: LucideIcon;
  variant?: 'primary' | 'success' | 'warning' | 'info' | 'neutral';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  sublabel,
  icon: Icon,
  variant = 'primary'
}) => {
  const iconThemes = {
    primary: 'bg-violet-50 text-violet-600 border-violet-100',
    success: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    warning: 'bg-amber-50 text-amber-600 border-amber-100',
    info: 'bg-sky-50 text-sky-600 border-sky-100',
    neutral: 'bg-slate-50 text-slate-600 border-slate-100'
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
        </div>
        <div className={cn('p-3 rounded-lg border', iconThemes[variant])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {sublabel && (
        <p className="text-xs text-slate-400 mt-3 pt-2 border-t border-slate-100">
          {sublabel}
        </p>
      )}
    </div>
  );
};
