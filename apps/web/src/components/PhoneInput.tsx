import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  countries,
  formatE164,
  type Country,
} from '@/lib/countries';

type PhoneInputProps = {
  country: Country;
  onCountryChange: (country: Country) => void;
  value: string;
  onChange: (localNumber: string) => void;
  placeholder?: string;
  className?: string;
};

export function PhoneInput({
  country,
  onCountryChange,
  value,
  onChange,
  placeholder = '300 123 4567',
  className = '',
}: PhoneInputProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`flex gap-2 ${className}`}>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex h-full min-h-[42px] items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 hover:bg-slate-100"
          aria-label="Seleccionar país"
        >
          <span className="text-lg leading-none">{country.flag}</span>
          <span className="font-medium">{country.dial}</span>
          <ChevronDown size={14} className="text-slate-400" />
        </button>
        {open && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40"
              aria-label="Cerrar"
              onClick={() => setOpen(false)}
            />
            <ul
              className="absolute left-0 top-full z-50 mt-1 max-h-64 w-56 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
            >
              {countries.map((c) => (
                <li key={c.code}>
                  <button
                    type="button"
                    onClick={() => {
                      onCountryChange(c);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                      c.code === country.code ? 'bg-brand-light/50 text-brand' : 'text-slate-700'
                    }`}
                  >
                    <span className="text-lg">{c.flag}</span>
                    <span className="flex-1 truncate">{c.name}</span>
                    <span className="text-slate-400">{c.dial}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      <input
        type="tel"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand"
      />
    </div>
  );
}

export function toE164(country: Country, localNumber: string): string {
  return formatE164(country, localNumber);
}
