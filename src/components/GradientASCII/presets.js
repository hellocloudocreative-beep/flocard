const CHARACTER_SETS = {
  Letters: " =+xX0S8#@",
  Classic: " .:-=+*#%@",
  Binary: " 01",
  Blocks: " \u2591\u2592\u2593\u2588",
  Dots: " \xB7\u2022\u25CF"
};
const PRESETS = {
  Atmosphere: {
    colors: ["#1e3fd8", "#f6f8ff", "#a5d8ff", "#38bdf8"],
    shape: "horizon",
    characters: CHARACTER_SETS.Letters,
    cellSize: 18
  },
  Lagoon: {
    colors: ["#0d9488", "#5eead4", "#f0fdfa"],
    shape: "pinch",
    characters: CHARACTER_SETS.Classic,
    cellSize: 16
  },
  Rose: {
    colors: ["#9f1239", "#f43f5e", "#fda4af", "#fff1f2"],
    shape: "rise",
    characters: CHARACTER_SETS.Letters,
    cellSize: 22
  },
  Corona: {
    colors: ["#78350f", "#f59e0b", "#fffbeb"],
    shape: "eclipse",
    characters: CHARACTER_SETS.Binary,
    cellSize: 15
  }
};
const DEFAULTS = {
  ...PRESETS.Atmosphere,
  colors: [...PRESETS.Atmosphere.colors],
  shape: "horizon",
  density: 0.8,
  glyphOpacity: 0.85,
  gradientOpacity: 0.9,
  glow: 0.2,
  depthOfField: 0,
  flicker: 0.2,
  softness: 0.5,
  scale: 1,
  flow: 0.5,
  speed: 1,
  grain: 0.08,
  variation: 0,
  mouseInteraction: true,
  scrambleRadius: 0.1,
  clickEffect: "wave",
  intro: true,
  lightMode: false,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace'
};
const RANGES = {
  cellSize: { label: "Cell Size", min: 8, max: 40, step: 1, unit: "px" },
  density: { label: "Density", min: 0, max: 1, step: 0.05 },
  glyphOpacity: { label: "Glyph Opacity", min: 0, max: 1, step: 0.05 },
  gradientOpacity: { label: "Gradient Opacity", min: 0, max: 1, step: 0.05 },
  glow: { label: "Glow", min: 0, max: 1.5, step: 0.05 },
  depthOfField: { label: "Depth of Field", min: 0, max: 1, step: 0.05 },
  flicker: { label: "Flicker", min: 0, max: 1, step: 0.05 },
  softness: { label: "Softness", min: 0, max: 1, step: 0.05 },
  scale: { label: "Scale", min: 0.4, max: 2.5, step: 0.05 },
  flow: { label: "Flow", min: 0, max: 2, step: 0.05 },
  speed: { label: "Speed", min: 0, max: 3, step: 0.05 },
  grain: { label: "Grain", min: 0, max: 0.4, step: 0.01 },
  variation: { label: "Variation", min: 0, max: 10, step: 1 },
  scrambleRadius: { label: "Scramble Radius", min: 0.02, max: 0.4, step: 0.01 }
};
function presetOf(settings) {
  for (const [name, preset] of Object.entries(PRESETS)) {
    if (preset.shape === settings.shape && preset.characters === settings.characters && preset.cellSize === settings.cellSize && preset.colors.join() === settings.colors.join())
      return name;
  }
  return null;
}
function characterSetOf(characters) {
  for (const [name, set] of Object.entries(CHARACTER_SETS))
    if (set === characters) return name;
  return null;
}
export {
  CHARACTER_SETS,
  DEFAULTS,
  PRESETS,
  RANGES,
  characterSetOf,
  presetOf
};
