import React from 'react';
import { ChevronRight, Users } from 'lucide-react';

export default function GroupCard({ group, onClick }) {
  const participantCount = group.participants ? group.participants.length : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full min-h-[56px] text-left p-4 bg-white hover:bg-slate-50/80 active:bg-slate-100 rounded-xl border border-slate-200/80 transition-colors flex items-center justify-between gap-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
    >
      <div className="flex-1 min-w-0">
        <h2 className="text-base font-semibold text-slate-900 truncate">
          {group.name}
        </h2>
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
