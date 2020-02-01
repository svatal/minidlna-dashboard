import * as b from "bobril";
import { IDir, IFile } from "./data";

const ico = {
  play: b.asset("ico\\youtube.svg"),
  eye: b.asset("ico\\eye.svg"),
  download: b.asset("ico\\download.svg")
};

export function Dirs(p: { dirs: IDir[] }) {
  var data = [...p.dirs];
  sort(data);
  return (
    <>
      {data.map(d => (
        <DirTile dir={d} />
      ))}
    </>
  );
}

function DirTile(p: { dir: IDir }) {
  const d = p.dir;
  const stats = getDirStats(d.files);
  const state = getDirState(stats);
  const colors = getDirColor(state);
  return (
    <div
      style={{
        margin: "10px auto",
        maxWidth: 300,
        padding: 10,
        borderRadius: 15,
        backgroundImage: `linear-gradient(to bottom, ${colors[0]}, ${colors[1]})`
      }}
    >
      <div style={{ float: "right" }}>
        <div>
          <Icon src={ico.eye} /> {stats.seen}
        </div>
        <div>
          <Icon src={ico.play} /> {stats.unseenPrepared}
        </div>
        <div>
          <Icon src={ico.download} /> {stats.unseenUnprepared}
        </div>
      </div>
      <div>{d.dirname}</div>
      <div style={{ clear: "both" }}></div>
    </div>
  );
}

function Icon(p: { src: string }) {
  return <img width={14} height={14} src={p.src} />;
}

interface IDirStats {
  seen: number;
  unseenPrepared: number;
  unseenUnprepared: number;
}

function getDirStats(files: IFile[]): IDirStats {
  const shouldHaveSubtitles = files.filter(f => f.subtitles).length > 0;
  return {
    seen: files.filter(f => f.seen).length,
    unseenPrepared: files.filter(
      f => !f.seen && (!shouldHaveSubtitles || f.subtitles)
    ).length,
    unseenUnprepared: files.filter(
      f => !f.seen && shouldHaveSubtitles && !f.subtitles
    ).length
  };
}

enum DirState {
  prepared,
  notStarted,
  waitingForSubtitles,
  seen
}

function getDirState(stats: IDirStats): DirState {
  if (!stats.seen) return DirState.notStarted;
  if (stats.unseenPrepared) return DirState.prepared;
  if (stats.unseenUnprepared) return DirState.waitingForSubtitles;
  return DirState.seen;
}

function getDirColor(state: DirState): [string, string] {
  switch (state) {
    case DirState.seen:
      return ["#6d989b", "#1a5e63"];
    case DirState.prepared:
      return ["#54b451", "#149911"];
    case DirState.notStarted:
      return ["#34c9c9", "#079b9b"];
    case DirState.waitingForSubtitles:
      return ["#5eaeb8", "#028090"];
  }
}

export function sort(array: IDir[]) {
  array.sort((a, b) => {
    const aState = getDirState(getDirStats(a.files));
    const bState = getDirState(getDirStats(b.files));
    if (aState !== bState) return aState - bState;
    return a.dirname.localeCompare(b.dirname);
  });
}
