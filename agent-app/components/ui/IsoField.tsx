import { View } from "react-native";

const TILE = 32;

// 2×2 isometric farm plot: each tile is a rotated+flattened diamond with a
// darker extruded side underneath — a tiny 3D field (greens + one honey crop).
const tiles = [
  { x: 30, y: 2, top: "#8fd3a4", side: "#4f8f66" },
  { x: 7, y: 13, top: "#55a76e", side: "#37744c" },
  { x: 53, y: 13, top: "#edb654", side: "#b98a2e" },
  { x: 30, y: 25, top: "#368752", side: "#245c38" },
];

const diamond = (color: string, top: number) => ({
  position: "absolute" as const,
  top,
  width: TILE,
  height: TILE,
  borderRadius: 7,
  backgroundColor: color,
  transform: [{ rotate: "45deg" }, { scaleY: 0.5 }],
});

export function IsoField() {
  return (
    <View style={{ width: 94, height: 64 }}>
      {tiles.map((t, i) => (
        <View key={i} style={{ position: "absolute", left: t.x, top: t.y, width: TILE, height: TILE }}>
          <View style={diamond(t.side, 6)} />
          <View style={diamond(t.top, 0)} />
        </View>
      ))}
    </View>
  );
}
