import React from 'react';
import { MessageCircle } from 'lucide-react';
import { getWhatsAppShareUrl } from '../utils/whatsappFormatter.js';

export default function WhatsAppButton({ groupName, totalExpenses, balances, transactions }) {
  const handleShare = () => {
    const url = getWhatsAppShareUrl(groupName, totalExpenses, balances, transactions);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="w-full min-h-[48px] bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium rounded-xl flex items-center justify-center gap-2.5 transition-colors shadow-sm text-sm"
    >
      <MessageCircle className="w-5 h-5 shrink-0 stroke-[2.2]" />
      <span>Compartir por WhatsApp</span>
    </button>
  );
}
