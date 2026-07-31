import { countries, defaultCountry, formatE164, type Country } from './countries';

/** Normaliza teléfono desde columnas de plantilla masiva. */
export function resolveBulkPhone(row: Record<string, string>): string {
  const to = row.to?.trim();
  if (to?.startsWith('+')) return to.replace(/\s/g, '');

  const phone =
    row.telefono?.trim() ||
    row.phone?.trim() ||
    row.numero?.trim() ||
    row.celular?.trim() ||
  '';

  const dial =
    row.codigo_pais?.trim() ||
    row.dial?.trim() ||
    row.country_code?.trim() ||
    row.pais?.trim() ||
    '';

  if (!phone) return to ?? '';

  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';

  if (dial) {
    const dialDigits = dial.replace(/\D/g, '');
    const dialNorm = dial.startsWith('+') ? dial : `+${dialDigits}`;
    if (digits.startsWith(dialDigits)) return `+${digits}`;
    return `${dialNorm}${digits}`;
  }

  if (phone.startsWith('+')) return phone.replace(/\s/g, '');
  return `+${digits}`;
}

export function findCountryByDial(dial: string): Country | undefined {
  const d = dial.replace(/\D/g, '');
  return countries.find((c) => c.dial.replace(/\D/g, '') === d);
}

export function parseLocalNumber(e164: string, country: Country): string {
  const digits = e164.replace(/\D/g, '');
  const dialDigits = country.dial.replace(/\D/g, '');
  if (digits.startsWith(dialDigits)) return digits.slice(dialDigits.length);
  return e164.replace(/\D/g, '');
}

export function formatPhoneDisplay(e164: string, country?: Country): string {
  if (!e164) return '';
  const c = country ?? defaultCountry;
  const local = parseLocalNumber(e164, c);
  return `${c.dial} ${local}`;
}

export { countries, defaultCountry, formatE164, type Country };
