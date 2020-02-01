import { useFetch } from "./http";

export interface IDir {
  dirname: string;
  files: IFile[];
}

export interface IFile {
  filename: string;
  subtitles: boolean;
  seen: boolean;
}

export function useFetchMyData() {
  return useFetch<IDir[]>("http://192.168.1.1/cgi-bin/cust/test.py");
}
