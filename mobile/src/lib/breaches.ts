import bundled from '../data/breaches.json';
import { SITE_URL } from '../theme';
import { DataType, orderTypes } from './checklist';

export type Breach = { year: number; types: DataType[]; added: string; note?: string };
export type Company = { name: string; aliases?: string[]; breaches: Breach[] };

/**
 * Keeps only well-formed entries, so a bad edit to breaches.json on the website
 * can't crash the app. Unknown data types are dropped.
 */
export function parseCompanies(raw: unknown): Company[] {
  if (!Array.isArray(raw)) return [];
  const out: Company[] = [];
  for (const c of raw) {
    if (!c || typeof c.name !== 'string' || !Array.isArray(c.breaches)) continue;
    const breaches: Breach[] = [];
    for (const b of c.breaches) {
      if (!b || typeof b.year !== 'number' || !Array.isArray(b.types)) continue;
      const types = orderTypes(b.types.filter((t: unknown) => typeof t === 'string'));
      if (types.length === 0) continue;
      breaches.push({ year: b.year, types, added: String(b.added ?? ''), note: typeof b.note === 'string' ? b.note : undefined });
    }
    if (breaches.length === 0) continue;
    const aliases = Array.isArray(c.aliases) ? c.aliases.filter((a: unknown): a is string => typeof a === 'string') : undefined;
    out.push({ name: c.name, aliases, breaches });
  }
  return out;
}

export const BUNDLED_COMPANIES = parseCompanies(bundled);

/** Fetches the live list from the website. Throws if offline or the response is unusable. */
export async function fetchLiveCompanies(timeoutMs = 8000): Promise<Company[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(SITE_URL + '/breaches.json', { signal: controller.signal, headers: { 'Cache-Control': 'no-cache' } });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const companies = parseCompanies(await res.json());
    if (companies.length === 0) throw new Error('Empty breach list');
    return companies;
  } finally {
    clearTimeout(timer);
  }
}

export const yearsOf = (c: Company) => c.breaches.map(b => b.year).join(', ');

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

export type Match = { company: Company; alias?: string };

/** Punctuation-insensitive search over names and aliases; names that start with the query come first. */
export function searchCompanies(companies: Company[], query: string): Match[] {
  const q = normalize(query);
  if (!q) return [];
  return companies
    .map(company => {
      const namePos = normalize(company.name).indexOf(q);
      const alias = namePos === -1 ? company.aliases?.find(a => normalize(a).includes(q)) : undefined;
      return { company, alias, pos: alias ? normalize(alias).indexOf(q) : namePos };
    })
    .filter(m => m.pos !== -1)
    .sort((a, b) => Number(b.pos === 0) - Number(a.pos === 0))
    .map(({ company, alias }) => ({ company, alias }));
}
