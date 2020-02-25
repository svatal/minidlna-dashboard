import * as b from "bobril";
import { DeepReadonly } from "ts-essentials";
import { Store, IMyDir, DirState, IGroupStats } from "./model";

const ico = {
  play: b.asset("ico\\youtube.svg"),
  eye: b.asset("ico\\eye.svg"),
  download: b.asset("ico\\download.svg")
};
const innerTilePadding = 10;

export function Dirs(p: { store: Store }) {
  var data = p.store.getData();
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
        <DirTile dir={d} index={i} />
      ))}
    </div>
  );
}

function DirTile({ dir, index }: { dir: DeepReadonly<IMyDir>; index: number }) {
  const colors = getDirColor(dir.state);
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
        stats={dir.seen}
        ico={ico.eye}
        positionStyles={{ gridRow: `${row}`, paddingTop: innerTilePadding }}
      />
      <GroupStats
        stats={dir.unseenPrepared}
        ico={ico.play}
        positionStyles={{ gridRow: `${row + 1}` }}
      />
      <GroupStats
        stats={dir.unseenUnprepared}
        ico={ico.download}
        positionStyles={{
          gridRow: `${row + 2}`,
          paddingBottom: innerTilePadding
        }}
      />
      <MarkAsSeenTile row={row} dir={dir} colors={colors} />
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
  dir,
  row,
  colors
}: {
  dir: IMyDir;
  row: number;
  colors: [string, string];
}) {
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
  if (!dir.nextToWatch) return <div style={positionStyle} />;
  if (dir.processing) return <div style={positionStyle}>loading</div>;
  if (dir.processingError)
    return <div style={positionStyle}>{dir.processingError}</div>;
  return (
    <div
      style={[coloredStyle, { cursor: "pointer", textAlign: "center" }]}
      onClick={() => {
        dir.setNextToWatchAsSeen();
        return true;
      }}
    >
      Mark
      <br />
      {dir.nextToWatch}
      <br />
      as seen
    </div>
  );
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
