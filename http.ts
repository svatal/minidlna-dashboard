import { useState, useEffect } from "bobril";
import { DeepReadonly } from "ts-essentials";

export function useFetch<TData>(
  url: string
): {
  loading: boolean;
  error: any;
  data: DeepReadonly<TData> | undefined;
  reload: () => void;
} {
  const loading = useState(true);
  const error = useState<any>(undefined);
  const data = useState<DeepReadonly<TData> | undefined>(undefined);
  async function fetchData() {
    loading(true);
    try {
      const response = await fetch(url);
      const d = await response.json();
      data(d as DeepReadonly<TData>);
      loading(false);
    } catch (e) {
      error(e);
      loading(false);
    }
  }
  useEffect(() => {
    fetchData();
  }, []);
  return {
    loading: loading(),
    error: error(),
    data: data(),
    reload: fetchData
  };
}

export function useCommand(): {
  loading: boolean;
  error: any;
  issue: (url: string, onSuccess: () => void) => void;
} {
  const loading = useState(false);
  const error = useState<any>(undefined);
  return {
    loading: loading(),
    error: error(),
    issue: (url: string, onSuccess: () => void = () => {}) => {
      (async () => {
        loading(true);
        try {
          const response = await fetch(url);
          const d = (await response.text()).trim();
          if (d === "ok") {
            error(undefined);
            onSuccess();
          } else {
            error(d);
          }
          loading(false);
        } catch (e) {
          error(e);
          loading(false);
        }
      })();
    }
  };
}
