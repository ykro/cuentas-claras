import React from 'react';

export default function CurrencyInput({ value, onChange, placeholder = "0.00", autoFocus = false }) {
  const handleChange = (e) => {
    let val = e.target.value;

    // Permitir vacío
    if (val === '') {
      onChange('');
      return;
    }

    // Normalizar coma a punto
    val = val.replace(',', '.');

    // Validar formato numérico positivo con hasta dos decimales
    if (/^\d*\.?\d{0,2}$/.test(val)) {
      onChange(val);
    }
  };

  return (
    <div className="relative flex items-center justify-center bg-slate-50 border border-slate-200/90 rounded-2xl p-3 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent transition-all">
      <span className="text-2xl sm:text-3xl font-extrabold text-slate-400 font-mono mr-1.5 select-none">
        $
      </span>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full text-center text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono bg-transparent focus:outline-none placeholder:text-slate-300"
      />
    </div>
  );
}
