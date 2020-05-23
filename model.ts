import { DeepReadonly } from "ts-essentials";
import { IDir, IFile } from "./data/data";
import { isDefined, first } from "./util";
import { useState, useMemo } from "bobril";

export interface IGroupStats {
  length: number;
  first: { filename: string; episode: string } | null;
}

interface IDirStats {
  seen: IGroupStats;
  unseenPrepared: IGroupStats;
  unseenUnprepared: IGroupStats;
}

export enum DirState {
  prepared,
  notStarted,
  waitingForSubtitles,
  seen,
}

export interface IMyDir extends IDirStats {
  dirname: string;
  state: DirState;
  processing: boolean;
  processingError: any;
  nextToWatch: string | undefined;
  setNextToWatchAsSeen: () => void;
}

function getKey(dirname: string, filename: string) {
  return `${dirname}/${filename}`;
}

// function changeOrPreserve<T, K extends keyof T>(
//   obj: T,
//   key: K,
//   newValue: T[K]
// ): T {
//   if (obj[key] === newValue) return obj;
//   return { ...obj, [key]: newValue };
// }

// function changeOrPreserveMap<T>(
//   array: readonly T[],
//   fn: (item: T) => T
// ): readonly T[];
// function changeOrPreserveMap<T>(array: T[], fn: (item: T) => T): T[];
// function changeOrPreserveMap<T>(
//   array: readonly T[],
//   fn: (item: T) => T
// ): readonly T[] {
//   const newArray = array.map((v) => fn(v));
//   return array.every((_, i) => array[i] === newArray[i]) ? array : newArray;
// }

export function useModifiedData(data: DeepReadonly<IDir[]> | undefined) {
  const [seen, setSeen] = useState<string[]>([]);
  return useMemo(
    () => ({
      setAsSeen: (key: string) => {
        setSeen([...seen, key]);
      },
      data: data?.map((d) => ({
        ...d,
        files: d.files.map((f) => ({
          ...f,
          seen:
            seen.indexOf(getKey(d.dirname, f.filename)) >= 0 ? true : f.seen,
        })),
      })),
      // data: changeOrPreserveMap(data, (d) =>
      //   changeOrPreserve(
      //     d,
      //     "files",
      //     changeOrPreserveMap(d.files, (f) =>
      //       changeOrPreserve(
      //         f,
      //         "seen",
      //         seen.indexOf(getKey(d.dirname, f.filename)) >= 0 ? true : f.seen
      //       )
      //     )
      //   )
      // ),
    }),
    [data, ...seen]
  );
}

export class Store {
  private _seen: string[] = [];
  enrichData(
    data: DeepReadonly<IDir[]> | undefined
  ): DeepReadonly<IDir[]> | undefined {
    return data?.map((d) => ({
      ...d,
      files: d.files.map((f) => ({
        ...f,
        seen:
          this._seen.indexOf(getKey(d.dirname, f.filename)) >= 0
            ? true
            : f.seen,
      })),
    }));
  }
  setAsSeen(key: string) {
    this._seen.push(key);
  }
}

export function transformData(
  data: DeepReadonly<IDir[]>,
  markAsSeen: {
    processing: string | undefined;
    loading: boolean;
    error: any;
    issue: (key: string) => void;
  }
) {
  const dirs = data.map<IMyDir>((d) => {
    const stats = getDirStats(d.files);
    const state = getDirState(stats);
    const nextToWatch =
      stats.unseenPrepared.first || stats.unseenUnprepared.first;
    return {
      dirname: d.dirname,
      ...stats,
      state,
      processing:
        !!markAsSeen.processing?.startsWith(d.dirname) && markAsSeen.loading,
      processingError:
        markAsSeen.processing?.startsWith(d.dirname) && markAsSeen.error,
      nextToWatch: nextToWatch?.episode,
      setNextToWatchAsSeen: () =>
        nextToWatch &&
        markAsSeen.issue(getKey(d.dirname, nextToWatch.filename)),
    };
  });
  sort(dirs);
  return dirs as DeepReadonly<IMyDir[]>;
}

function sort(array: { dirname: string; state: DirState }[]) {
  array.sort((a, b) => {
    if (a.state !== b.state) return a.state - b.state;
    return a.dirname.localeCompare(b.dirname);
  });
}

function getDirStats(files: DeepReadonly<IFile[]>): IDirStats {
  const shouldHaveSubtitles = files.filter((f) => f.subtitles).length > 0;
  const seen = files.filter((f) => f.seen);
  const unseenPrepared = files.filter(
    (f) => !f.seen && (!shouldHaveSubtitles || f.subtitles)
  );
  const unseenUnprepared = files.filter(
    (f) => !f.seen && shouldHaveSubtitles && !f.subtitles
  );
  return {
    seen: getGroupStats(seen),
    unseenPrepared: getGroupStats(unseenPrepared),
    unseenUnprepared: getGroupStats(unseenUnprepared),
  };
}

function getGroupStats(files: IFile[]): IGroupStats {
  const episodes = files
    .map((f) => ({
      filename: f.filename,
      episode: getEpisode(f.filename)!,
    }))
    .filter((f) => isDefined(f.episode));
  episodes.sort((a, b) => a.episode.localeCompare(b.episode));
  return {
    length: files.length,
    first: first(episodes),
  };
}

function getEpisode(fileName: string): string | null {
  const res =
    /S\d\dE\d\d/i.exec(fileName) ||
    /S\d\d[ .]/i.exec(fileName) ||
    /\d\dx\d\d/i.exec(fileName) ||
    /\d+/.exec(fileName);
  return res === null ? null : res[0];
}

function getDirState(stats: IDirStats): DirState {
  if (stats.seen.length == 0) return DirState.notStarted;
  if (stats.unseenPrepared.length > 0) return DirState.prepared;
  if (stats.unseenUnprepared.length > 0) return DirState.waitingForSubtitles;
  return DirState.seen;
}
