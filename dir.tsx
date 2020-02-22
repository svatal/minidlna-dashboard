import * as b from "bobril";
import { IDir, IFile, useMarkAsSeen } from "./data/data";
import { first, isDefined } from "./util";

const ico = {
  play: b.asset("ico\\youtube.svg"),
  eye: b.asset("ico\\eye.svg"),
  download: b.asset("ico\\download.svg")
};
const innerTilePadding = 10;

export function Dirs(p: { dirs: IDir[]; reload: () => void }) {
  var data = [...p.dirs];
  sort(data);
  return (
    <div
      style={{
        margin: "10px auto",
        width: 500,
        display: "grid",
        gridTemplateColumns: "auto max-content max-content max-content 100px",
        gridColumnGap: 5
      }}
    >
      {data.map((d, i) => (
        <DirTile dir={d} reload={p.reload} index={i} />
      ))}
    </div>
  );
}

function DirTile({
  dir,
  reload,
  index
}: {
  dir: IDir;
  reload: () => void;
  index: number;
}) {
  const stats = getDirStats(dir.files);
  const state = getDirState(stats);
  const colors = getDirColor(state);
  const row = index * 4 + 1;
  return (
    <>
      <div
        style={{
          gridColumn: "1 / span 4",
          gridRow: `${row} / span 3`,
          borderRadius: 15,
          backgroundImage: `linear-gradient(to bottom, ${colors[0]}, ${colors[1]})`
        }}
      ></div>
      <div
        style={{
          gridColumn: "1",
          gridRow: `${row} / span 3`,
          padding: innerTilePadding,
          justifySelf: "center",
          alignSelf: "center"
        }}
      >
        {dir.dirname}
      </div>
      <GroupStats
        stats={stats.seen}
        ico={ico.eye}
        positionStyles={{ gridRow: `${row}`, paddingTop: innerTilePadding }}
      />
      <GroupStats
        stats={stats.unseenPrepared}
        ico={ico.play}
        positionStyles={{ gridRow: `${row + 1}` }}
      />
      <GroupStats
        stats={stats.unseenUnprepared}
        ico={ico.download}
        positionStyles={{
          gridRow: `${row + 2}`,
          paddingBottom: innerTilePadding
        }}
      />
      <MarkAsSeenTile
        row={row}
        dirname={dir.dirname}
        stats={stats}
        reload={reload}
        colors={colors}
      />
      <div style={{ gridRow: `${row + 3}`, height: 10 }} />
    </>
  );
}

function GroupStats({
  stats,
  ico,
  positionStyles
}: {
  stats: IGroupStats;
  ico: string;
  positionStyles: b.IBobrilStyle;
}) {
  return (
    <>
      <Icon
        src={ico}
        style={[
          positionStyles,
          {
            gridColumn: "2"
          }
        ]}
      />
      <div
        style={[
          positionStyles,
          {
            gridColumn: "3"
          }
        ]}
      >
        {stats.length}
      </div>
      <div
        style={[
          positionStyles,
          {
            gridColumn: "4",
            paddingRight: innerTilePadding
          }
        ]}
      >
        {stats.first?.episode}
      </div>
    </>
  );
}

const iconSize = 18;
function Icon(p: { src: string; style: b.IBobrilStyles }) {
  return <img width={iconSize} height={iconSize} src={p.src} style={p.style} />;
}

function MarkAsSeenTile({
  dirname,
  stats,
  reload,
  row,
  colors
}: {
  dirname: string;
  stats: IDirStats;
  reload: () => void;
  row: number;
  colors: [string, string];
}) {
  const { loading, error, issue } = useMarkAsSeen();
  const positionStyle: b.IBobrilStyle = {
    gridRow: `${row} / span 3`,
    gridColumn: "5",
    padding: innerTilePadding,
    borderRadius: 15
  };
  const coloredStyle: b.IBobrilStyles = [
    positionStyle,
    {
      backgroundImage: `linear-gradient(to bottom, ${colors[0]}, ${colors[1]})`
    }
  ];
  if (stats.unseenPrepared.length === 0 && stats.unseenUnprepared.length === 0)
    return <div style={positionStyle} />;
  if (loading) return <div style={positionStyle}>loading</div>;
  if (error) return <div style={positionStyle}>{error}</div>;
  const toBeSeen = stats.unseenPrepared.first || stats.unseenUnprepared.first!;
  return (
    <div
      style={[coloredStyle, { cursor: "pointer", textAlign: "center" }]}
      onClick={() => {
        issue(`${dirname}/${toBeSeen.filename}`, reload);
        return true;
      }}
    >
      Mark
      <br />
      {toBeSeen.episode}
      <br />
      as seen
    </div>
  );
}

interface IGroupStats {
  length: number;
  first: { filename: string; episode: string } | null;
}

interface IDirStats {
  seen: IGroupStats;
  unseenPrepared: IGroupStats;
  unseenUnprepared: IGroupStats;
}

function getDirStats(files: IFile[]): IDirStats {
  const shouldHaveSubtitles = files.filter(f => f.subtitles).length > 0;
  const seen = files.filter(f => f.seen);
  const unseenPrepared = files.filter(
    f => !f.seen && (!shouldHaveSubtitles || f.subtitles)
  );
  const unseenUnprepared = files.filter(
    f => !f.seen && shouldHaveSubtitles && !f.subtitles
  );
  return {
    seen: getGroupStats(seen),
    unseenPrepared: getGroupStats(unseenPrepared),
    unseenUnprepared: getGroupStats(unseenUnprepared)
  };
}

function getGroupStats(files: IFile[]): IGroupStats {
  const episodes = files
    .map(f => ({ filename: f.filename, episode: getEpisode(f.filename)! }))
    .filter(f => isDefined(f.episode));
  episodes.sort((a, b) => a.episode.localeCompare(b.episode));
  return {
    length: files.length,
    first: first(episodes)
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

enum DirState {
  prepared,
  notStarted,
  waitingForSubtitles,
  seen
}

function getDirState(stats: IDirStats): DirState {
  if (stats.seen.length == 0) return DirState.notStarted;
  if (stats.unseenPrepared.length > 0) return DirState.prepared;
  if (stats.unseenUnprepared.length > 0) return DirState.waitingForSubtitles;
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
