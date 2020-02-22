import { useFetch, useCommand } from "../http";
import { asset } from "bobril";

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
  return useFetch<IDir[]>(listFiles);
}

const markAsSeen = asset("markAsSeen.py");
export function useMarkAsSeen() {
  const { loading, error, issue } = useCommand();
  return {
    loading,
    error,
    issue: (filePath: string, onSuccess: () => void) =>
      issue(`${markAsSeen}?path=${filePath}`, onSuccess)
  };
}
