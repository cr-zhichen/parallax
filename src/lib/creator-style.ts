export type MarkerShape = "circle" | "square" | "diamond" | "triangle";
export type CreatorTheme = "light" | "dark";

export interface CreatorStyle {
  color: string;
  shape: MarkerShape;
}

interface KnownCreatorStyle {
  dark: string;
  light: string;
  shape: MarkerShape;
}

const knownStyles: Array<[string, KnownCreatorStyle]> = [
  ["openai", { light: "#2f2b27", dark: "#d8c7b8", shape: "circle" }],
  ["anthropic", { light: "#c96442", dark: "#e98b69", shape: "square" }],
  ["google", { light: "#589268", dark: "#83c894", shape: "diamond" }],
  ["deepseek", { light: "#4b6fb8", dark: "#86aaf4", shape: "circle" }],
  ["xai", { light: "#7969a9", dark: "#af9ae8", shape: "circle" }],
  ["minimax", { light: "#bd5c76", dark: "#e78ba5", shape: "triangle" }],
  ["nvidia", { light: "#78934c", dark: "#afd176", shape: "diamond" }],
  ["alibaba", { light: "#cc7950", dark: "#eb986d", shape: "circle" }],
  ["meta", { light: "#3c86a3", dark: "#68b7d7", shape: "circle" }],
  ["mistral", { light: "#b96b45", dark: "#e59569", shape: "circle" }],
  ["zai", { light: "#5d8ca6", dark: "#8bc8e3", shape: "circle" }],
  ["kimi", { light: "#4389a0", dark: "#72c6df", shape: "circle" }],
  ["amazon", { light: "#6f747a", dark: "#b9c0c8", shape: "square" }],
  ["xiaomi", { light: "#bf6f43", dark: "#e9996d", shape: "circle" }],
  ["other", { light: "#8c8984", dark: "#c3bbb3", shape: "circle" }],
];

function normalizeCreator(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function hash(value: string): number {
  return Array.from(value).reduce(
    (total, character) => (total * 31 + character.charCodeAt(0)) >>> 0,
    7,
  );
}

export function getCreatorStyle(
  creator: string,
  theme: CreatorTheme = "light",
): CreatorStyle {
  const normalized = normalizeCreator(creator);
  const known = knownStyles.find(([key]) => normalized.includes(key));
  if (known) {
    return {
      color: theme === "dark" ? known[1].dark : known[1].light,
      shape: known[1].shape,
    };
  }

  const hue = hash(normalized) % 360;
  return {
    color: `hsl(${hue} ${theme === "dark" ? 55 : 35}% ${theme === "dark" ? 68 : 48}%)`,
    shape: ["circle", "square", "diamond", "triangle"][
      hash(normalized) % 4
    ] as MarkerShape,
  };
}
