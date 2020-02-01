import { useState, useEffect } from "bobril";

export function useFetch<TData>(
  url: string
): { loading: boolean; error: any; data: TData | undefined } {
  const loading = useState(true);
  const error = useState<any>(undefined);
  const data = useState<TData | undefined>(undefined);
  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(url);
        const d = await response.json();
        data(d as TData);
        loading(false);
      } catch (e) {
        error(e);
        loading(false);
      }
    })();
  }, []);
  return {
    loading: loading(),
    error: error(),
    data: data()
  };
}
