import React from 'react';
import { ChevronRight, Users, Lock } from 'lucide-react';

export default function GroupCard({ group, onClick }) {
  const participantCount = group.participants ? group.participants.length : 0;
  const isClosed = group.isClosed === true;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full min-h-[56px] text-left p-4 rounded-xl border transition-colors flex items-center justify-between gap-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
        isClosed
          ? 'bg-slate-50/90 hover:bg-slate-100/80 border-slate-200/70 text-slate-600'
          : 'bg-white hover:bg-slate-50/80 active:bg-slate-100 border-slate-200/80'
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h2 className={`text-base font-semibold truncate ${isClosed ? 'text-slate-600' : 'text-slate-900'}`}>
            {group.name}
          </h2>
          {isClosed && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 shrink-0">
              <Lock className="w-3 h-3" />
              <span>Cerrado</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
          <Users className="w-3.5 h-3.5 shrink-0 text-slate-400" />
          <span>
            {participantCount} {participantCount === 1 ? 'persona' : 'personas'}
          </span>
        </div>
      </div>

      <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
    </button>
  );
}
