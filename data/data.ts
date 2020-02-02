import { useFetch } from "../http";
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
