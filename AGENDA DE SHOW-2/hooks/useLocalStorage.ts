
import { useState, useEffect, Dispatch, SetStateAction } from 'react';

function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      console.log(`[useLocalStorage] Initializing key: "${key}". Raw item:`, item); // DEBUG LOG
      const parsedItem = item ? JSON.parse(item) : initialValue;
      console.log(`[useLocalStorage] Initial value for key: "${key}" is`, parsedItem); // DEBUG LOG
      return parsedItem;
    } catch (error) {
      console.error(`[useLocalStorage] Error reading localStorage key: "${key}"`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      console.log(`[useLocalStorage] Saving key: "${key}". Value:`, storedValue); // DEBUG LOG
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`[useLocalStorage] Error saving localStorage key: "${key}"`, error);
      // It's useful to provide a more specific error for QuotaExceededError
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error("[useLocalStorage] QuotaExceededError: O armazenamento local está cheio. Considere limpar os dados do site.");
      }
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

export default useLocalStorage;
