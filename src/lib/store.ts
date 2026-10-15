import { useEffect, useState } from "react";

/** Persisted local state — saves to the current browser's localStorage. */
export function useLocalState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      // corrupted entry — keep initial
    }
    setHydrated(true);
  }, [key]);

  const set = (next: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      try {
        window.localStorage.setItem(key, JSON.stringify(resolved));
      } catch {
        // storage full or unavailable — state still updates in memory
      }
      return resolved;
    });
  };

  return [value, set, hydrated] as const;
}

export function clearSmartWorkData() {
  const keys: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (k?.startsWith("smartwork:")) keys.push(k);
  }
  keys.forEach((k) => window.localStorage.removeItem(k));
}
