import { DeepReadonly } from "ts-essentials";
import { IDir, IFile } from "./data/data";
import { isDefined, first } from "./util";

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
  seen
}

export interface IMyDir extends IDirStats {
  dirname: string;
  state: DirState;
  processing: boolean;
  processingError: any;
  nextToWatch: string | undefined;
  setNextToWatchAsSeen: () => void;
}

export class Store {
  private _data: IDir[] | undefined = undefined;
  hasData = () => !!this._data;
  getData = () => {
    const dirs = this._data!.map<IMyDir>(d => {
      const stats = this.getDirStats(d.files);
      const state = this.getDirState(stats);
      const nextToWatch =
        stats.unseenPrepared.first || stats.unseenUnprepared.first;
      return {
        dirname: d.dirname,
        ...stats,
        state,
        processing:
          !!this._masProcessing?.startsWith(d.dirname) && this._masLoading,
        processingError:
          this._masProcessing?.startsWith(d.dirname) && this._masError,
        nextToWatch: nextToWatch?.episode,
        setNextToWatchAsSeen: () => this._setAsSeen(d, nextToWatch?.filename)
      };
    });
    this.sort(dirs);
    return dirs as DeepReadonly<IMyDir[]>;
  };
  setData(data: DeepReadonly<IDir[]>) {
    this._data = data as IDir[];
  }
  private _setAsSeen(dir: IDir, filename: string | undefined) {
    this._masIssue(`${dir.dirname}/${filename}`);
    dir.files.find(f => f.filename === filename)!.seen = true;
  }
  private _masLoading: boolean = false;
  private _masError: any = undefined;
  private _masIssue: (filePath: string) => void = () => {};
  private _masProcessing: string | undefined = undefined;
  setMarkAsSeen(p: {
    loading: boolean;
    error: any;
    processing: string | undefined;
    issue: (filePath: string) => void;
  }) {
    this._masLoading = p.loading;
    this._masError = p.error;
    this._masProcessing = p.processing;
    this._masIssue = p.issue;
  }

  private sort(array: { dirname: string; state: DirState }[]) {
    array.sort((a, b) => {
      if (a.state !== b.state) return a.state - b.state;
      return a.dirname.localeCompare(b.dirname);
    });
  }

  private getDirStats(files: IFile[]): IDirStats {
    const shouldHaveSubtitles = files.filter(f => f.subtitles).length > 0;
    const seen = files.filter(f => f.seen);
    const unseenPrepared = files.filter(
      f => !f.seen && (!shouldHaveSubtitles || f.subtitles)
    );
    const unseenUnprepared = files.filter(
      f => !f.seen && shouldHaveSubtitles && !f.subtitles
    );
    return {
      seen: this.getGroupStats(seen),
      unseenPrepared: this.getGroupStats(unseenPrepared),
      unseenUnprepared: this.getGroupStats(unseenUnprepared)
    };
  }

  private getGroupStats(files: IFile[]): IGroupStats {
    const episodes = files
      .map(f => ({
        filename: f.filename,
        episode: this.getEpisode(f.filename)!
      }))
      .filter(f => isDefined(f.episode));
    episodes.sort((a, b) => a.episode.localeCompare(b.episode));
    return {
      length: files.length,
      first: first(episodes)
    };
  }

  private getEpisode(fileName: string): string | null {
    const res =
      /S\d\dE\d\d/i.exec(fileName) ||
      /S\d\d[ .]/i.exec(fileName) ||
      /\d\dx\d\d/i.exec(fileName) ||
      /\d+/.exec(fileName);
    return res === null ? null : res[0];
  }

  private getDirState(stats: IDirStats): DirState {
    if (stats.seen.length == 0) return DirState.notStarted;
    if (stats.unseenPrepared.length > 0) return DirState.prepared;
    if (stats.unseenUnprepared.length > 0) return DirState.waitingForSubtitles;
    return DirState.seen;
  }
}
