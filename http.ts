import { useState, useEffect } from "bobril";
import { DeepReadonly } from "ts-essentials";

export function useFetchWithCallback<TData>(
  url: string,
  onLoaded: (data: DeepReadonly<TData>) => void
): {
  loading: boolean;
  error: any;
  reload: () => void;
} {
  const loading = useState(true);
  const error = useState<any>(undefined);
  async function fetchData() {
    loading(true);
    try {
      const response = await fetch(url);
      const d = await response.json();
      onLoaded(d as DeepReadonly<TData>);
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
    reload: fetchData,
  };
}

export function useFetch<TData>(url: string) {
  const [response, setResponse] = useState<DeepReadonly<TData> | undefined>(
    undefined
  );
  return {
    ...useFetchWithCallback<TData>(url, (data) => {
      setResponse(data);
    }),
    response,
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
    },
  };
}
