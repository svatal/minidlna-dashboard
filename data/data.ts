import { useCommand, useFetch, useFetchWithCallback } from "../http";
import { asset, useState, useStore } from "bobril";
import { useModifiedData, transformData, Store } from "../model";

export interface IDir {
  dirname: string;
  files: IFile[];
}

export interface IFile {
  filename: string;
  subtitles: boolean;
  seen: boolean;
}

const listFiles = asset("listFiles.py");
// use-like optimistic update
export function useFetchMyData() {
  const markAsSeen = useMarkAsSeen();
  const { loading, error, response } = useFetch<IDir[]>(listFiles);
  const { data, setAsSeen } = useModifiedData(response);

  return {
    loading,
    error,
    data: data
      ? transformData(data, {
          ...markAsSeen,
          issue: (key) => {
            setAsSeen(key);
            markAsSeen.issue(key);
          },
        })
      : undefined,
  };
}

// store-like optimistic update
export function useFetchMyData2() {
  const markAsSeen = useMarkAsSeen();
  const { loading, error, response } = useFetch<IDir[]>(listFiles);
  const store = useStore(() => new Store());
  const data = store.enrichData(response);
  return {
    loading,
    error,
    data: data
      ? transformData(data, {
          ...markAsSeen,
          issue: (key) => {
            store.setAsSeen(key);
            markAsSeen.issue(key);
          },
        })
      : undefined,
  };
}

const markAsSeen = asset("markAsSeen.py");
export function useMarkAsSeen() {
  const { loading, error, issue } = useCommand();
  const processing = useState<string | undefined>(undefined);
  return {
    loading,
    error,
    processing: processing(),
    issue: (filePath: string) => {
      processing(filePath);
      return issue(`${markAsSeen}?path=${filePath}`, () => {
        processing(undefined);
      });
    },
  };
}
