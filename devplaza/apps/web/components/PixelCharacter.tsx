"use client";

const SKIN: Record<string, string> = {
  light:  "#FDDBB4",
  tan:    "#E8A87C",
  medium: "#C68642",
  dark:   "#8D5524",
};

// color key: 0=transparent 1=skin 2=hair 3=pupil 4=shirt 5=bottom 6=shoe 8=mouth
const MALE_MAP = [
  [0,0,2,2,2,2,2,2,0,0],
  [0,2,2,2,2,2,2,2,2,0],
  [0,2,1,1,1,1,1,1,2,0],
  [0,2,1,3,1,1,3,1,2,0],
  [0,2,1,1,1,1,1,1,2,0],
  [0,2,1,1,8,8,1,1,2,0],
  [0,0,2,1,1,1,1,2,0,0],
  [0,0,4,4,4,4,4,4,0,0],
  [0,4,4,4,4,4,4,4,4,0],
  [0,4,4,4,4,4,4,4,4,0],
  [0,4,4,4,4,4,4,4,4,0],
  [0,0,4,4,0,0,4,4,0,0],
  [0,0,5,5,0,0,5,5,0,0],
  [0,0,5,5,0,0,5,5,0,0],
  [0,0,5,5,0,0,5,5,0,0],
  [0,0,5,5,0,0,5,5,0,0],
  [0,0,5,5,0,0,5,5,0,0],
  [0,0,6,6,0,0,6,6,0,0],
  [0,6,6,6,0,0,6,6,6,0],
];

const FEMALE_MAP = [
  [0,0,2,2,2,2,2,2,0,0],
  [0,2,2,2,2,2,2,2,2,0],
  [2,2,1,1,1,1,1,1,2,2],
  [2,2,1,3,1,1,3,1,2,2],
  [2,2,1,1,1,1,1,1,2,2],
  [2,2,1,1,8,8,1,1,2,2],
  [2,0,2,1,1,1,1,2,0,2],
  [0,0,4,4,4,4,4,4,0,0],
  [0,4,4,4,4,4,4,4,4,0],
  [0,4,4,4,4,4,4,4,4,0],
  [0,4,4,4,4,4,4,4,4,0],
  [0,5,5,5,5,5,5,5,5,0],
  [5,5,5,5,5,5,5,5,5,5],
  [5,5,5,5,5,5,5,5,5,5],
  [0,5,5,5,5,5,5,5,5,0],
  [0,0,5,5,5,5,5,5,0,0],
  [0,0,0,1,1,0,1,1,0,0],
  [0,0,0,1,1,0,1,1,0,0],
  [0,0,0,1,1,0,1,1,0,0],
  [0,0,0,6,6,0,6,6,0,0],
  [0,0,6,6,6,0,6,6,6,0],
];

function resolveColor(
  value: number,
  skinColor: string,
  gender: string,
): string {
  switch (value) {
    case 0: return "transparent";
    case 1: return SKIN[skinColor] ?? SKIN.light;
    case 2: return "#2C1810";
    case 3: return "#1A0A00";
    case 8: return "#C44B4B";
    case 4: return gender === "FEMALE" ? "#E87DA8" : "#4A90D9";
    case 5: return gender === "FEMALE" ? "#9B59B6" : "#2C3E50";
    case 6: return "#1A1A2E";
    default: return "transparent";
  }
}

interface Props {
  gender: string;
  skinColor: string;
  pixelSize?: number;
}

export default function PixelCharacter({ gender, skinColor, pixelSize = 16 }: Props) {
  const map = gender === "FEMALE" ? FEMALE_MAP : MALE_MAP;
  const rows = map.length;
  const cols = map[0].length;
  const w = cols * pixelSize;
  const h = rows * pixelSize;

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ imageRendering: "pixelated" }}
    >
      {map.map((row, r) =>
        row.map((val, c) => {
          const color = resolveColor(val, skinColor, gender);
          if (color === "transparent") return null;
          return (
            <rect
              key={`${r}-${c}`}
              x={c * pixelSize}
              y={r * pixelSize}
              width={pixelSize}
              height={pixelSize}
              fill={color}
            />
          );
        })
      )}
    </svg>
  );
}
