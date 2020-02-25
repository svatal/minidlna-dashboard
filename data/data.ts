import { useFetch, useCommand } from "../http";
import { asset, useStore, useState } from "bobril";
import { Store } from "../model";

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
export function useFetchMyData() {
  const store = useStore(() => new Store());
  const markAsSeen = useMarkAsSeen();
  const { loading, error } = useFetch<IDir[]>(listFiles, data =>
    store.setData(data)
  );
  store.setMarkAsSeen(markAsSeen);

  return { loading, error, store: store.hasData() ? store : undefined };
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
    }
  };
}
