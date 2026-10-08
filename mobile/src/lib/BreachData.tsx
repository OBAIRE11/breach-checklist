import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { BUNDLED_COMPANIES, Company, fetchLiveCompanies } from './breaches';

type Source = 'loading' | 'live' | 'offline';
type BreachData = { companies: Company[]; source: Source };

const BreachDataContext = createContext<BreachData>({ companies: BUNDLED_COMPANIES, source: 'loading' });

/**
 * Starts with the copy bundled in the app, so search works instantly and offline,
 * then swaps in the live list from the website when it arrives.
 */
export function BreachDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<BreachData>({ companies: BUNDLED_COMPANIES, source: 'loading' });

  useEffect(() => {
    let cancelled = false;
    fetchLiveCompanies()
      .then(companies => { if (!cancelled) setData({ companies, source: 'live' }); })
      .catch(() => { if (!cancelled) setData(d => ({ ...d, source: 'offline' })); });
    return () => { cancelled = true; };
  }, []);

  return <BreachDataContext.Provider value={data}>{children}</BreachDataContext.Provider>;
}

export const useBreachData = () => useContext(BreachDataContext);
