// =============================================================================
// File: frontend/src/components/admin/StatsCard.tsx
// Purpose: Reusable dashboard overview statistics card widget
// =============================================================================

import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: string;
  trendColor?: 'green' | 'red' | 'neutral';
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  description,
  trend,
  trendColor = 'neutral',
}) => {
  return (
    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800/80 hover:border-slate-700/60 shadow-lg transition-all duration-300 relative overflow-hidden group">
      {/* Glow highlight on hover */}
      <div className="absolute -right-10 -top-10 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-colors"></div>
      
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-450 uppercase tracking-wider">{title}</span>
        <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-850 text-indigo-400 group-hover:border-indigo-500/20 transition-all">
          {icon}
        </div>
      </div>
      
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold text-white tracking-tight">{value}</span>
        {trend && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
            trendColor === 'green' ? 'bg-emerald-950/40 text-emerald-450 border border-emerald-900/30' :
            trendColor === 'red' ? 'bg-rose-950/40 text-rose-405 border border-rose-900/30' :
            'bg-slate-800 text-slate-400'
          }`}>
            {trend}
          </span>
        )}
      </div>

      {description && (
        <p className="mt-2 text-xs text-slate-450 leading-relaxed">{description}</p>
      )}
    </div>
  );
};
export default StatsCard;
