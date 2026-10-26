import OBR from "@owlbear-rodeo/sdk";

const EXTENSION_ID = "com.wesleydsm.agentesaparicoes.ruler";
const APPEARANCE_BROADCAST_CHANNEL = `${EXTENSION_ID}/appearance-update`;
const APPEARANCE_METADATA_KEY = `${EXTENSION_ID}/appearance`;
const APPEARANCE_UPDATED_AT_KEY = `${EXTENSION_ID}/appearanceUpdatedAt`;
const LOCAL_APPEARANCE_STORAGE_PREFIX = `${EXTENSION_ID}:appearance:`;

const DEFAULTS = {
  lineColor: "#20242D", lineWidth: 8, lineStyle: "DASHED", lineOpacity: 100,
  nodeColor: "#F0F1EF", nodeStrokeColor: "#20242D", nodeSize: 26, nodeShape: "CIRCLE", nodeStrokeWidth: 5, nodeFillOpacity: 100, nodeStrokeOpacity: 100,
  terrainNodeColor: "#D8E0DA", terrainNodeStrokeColor: "#20242D", terrainNodeSize: 28, terrainNodeShape: "RECTANGLE", terrainNodeStrokeWidth: 5, terrainNodeFillOpacity: 100, terrainNodeStrokeOpacity: 100,
  confirmButtonColor: "#FFFFFF", cancelButtonColor: "#FFFFFF", terrainButtonColor: "#FFFFFF",
  confirmButtonIconColor: "#20242D", cancelButtonIconColor: "#20242D", terrainButtonIconColor: "#20242D",
  buttonSize: 50, buttonGap: 10, buttonIconScale: 70, buttonBorderColor: "#20242D", buttonBorderWidth: 5,
  indicatorBackgroundColor: "#ECEEF1", indicatorTextColor: "#20242D", indicatorBorderColor: "#20242D", indicatorBorderWidth: 5, indicatorWidth: 100, indicatorHeight: 50, indicatorFontSize: 30, indicatorOpacity: 100,
  circleAreaFillColor: "#000000", circleAreaFillOpacity: 28, circleAreaStrokeColor: "#FFFFFF", circleAreaStrokeOpacity: 100, circleAreaStrokeWidth: 2,
  coneAreaFillColor: "#000000", coneAreaFillOpacity: 28, coneAreaStrokeColor: "#FFFFFF", coneAreaStrokeOpacity: 100, coneAreaStrokeWidth: 2,
  areaIndicatorBackgroundColor: "#ECEEF1", areaIndicatorTextColor: "#20242D", areaIndicatorBorderColor: "#20242D",
  areaIndicatorBorderWidth: 5, areaIndicatorWidth: 100, areaIndicatorHeight: 50, areaIndicatorFontSize: 30, areaIndicatorOpacity: 100,
};

const LEGACY_AREA_DEFAULTS = { areaFillColor: "#D75B5B", areaFillOpacity: 28, areaStrokeColor: "#8E2C2C", areaStrokeOpacity: 75, areaStrokeWidth: 2 };

const LEGACY_DEFAULTS = {
  "lineColor": "#e53935",
  "nodeColor": "#ffffff",
  "nodeStrokeColor": "#e53935",
  "terrainNodeColor": "#ffd166",
  "terrainNodeStrokeColor": "#8f2d1e",
  "terrainNodeShape": "HEXAGON",
  "terrainNodeStrokeWidth": 4,
  "confirmButtonColor": "#21864a",
  "cancelButtonColor": "#b83342",
  "terrainButtonColor": "#7952a8",
  "confirmButtonIconColor": "#ffffff",
  "cancelButtonIconColor": "#ffffff",
  "terrainButtonIconColor": "#ffffff",
  "buttonBorderColor": "#ffffff",
  "buttonBorderWidth": 0,
  "indicatorBackgroundColor": "#20242d",
  "indicatorTextColor": "#ffffff",
  "indicatorBorderColor": "#586174",
  "indicatorBorderWidth": 0,
  "indicatorOpacity": 98
};

const COMPONENTS = {
  line: {
    title: "Linha do percurso", icon: "━",
    fields: [
      { key: "lineColor", label: "Cor", type: "color" },
      { key: "lineStyle", label: "Traço", type: "select", options: [["SOLID", "Sólida"], ["DASHED", "Tracejada"], ["DOTTED", "Pontilhada"]] },
      { key: "lineWidth", label: "Espessura", type: "range", min: 1, max: 24, step: 1, unit: "u" },
      { key: "lineOpacity", label: "Opacidade", type: "range", min: 5, max: 100, step: 5, unit: "%" },
    ],
    keys: ["lineColor", "lineStyle", "lineWidth", "lineOpacity"],
  },
  node: {
    title: "Nó comum", icon: "○",
    fields: [
      { key: "nodeShape", label: "Formato", type: "select", options: [["CIRCLE", "Círculo"], ["RECTANGLE", "Quadrado"], ["TRIANGLE", "Triângulo"], ["HEXAGON", "Hexágono"]] },
      { key: "nodeColor", label: "Preenchimento", type: "color" },
      { key: "nodeStrokeColor", label: "Cor do contorno", type: "color" },
      { key: "nodeSize", label: "Tamanho", type: "range", min: 10, max: 64, step: 1, unit: "u" },
      { key: "nodeStrokeWidth", label: "Espessura do contorno", type: "range", min: 0, max: 12, step: 0.5, unit: "u" },
      { key: "nodeFillOpacity", label: "Opacidade do preenchimento", type: "range", min: 0, max: 100, step: 5, unit: "%" },
      { key: "nodeStrokeOpacity", label: "Opacidade do contorno", type: "range", min: 0, max: 100, step: 5, unit: "%" },
    ],
    keys: ["nodeShape", "nodeColor", "nodeStrokeColor", "nodeSize", "nodeStrokeWidth", "nodeFillOpacity", "nodeStrokeOpacity"],
  },
  terrainNode: {
    title: "Nó de terreno difícil", icon: "⬡",
    fields: [
      { key: "terrainNodeShape", label: "Formato", type: "select", options: [["CIRCLE", "Círculo"], ["RECTANGLE", "Quadrado"], ["TRIANGLE", "Triângulo"], ["HEXAGON", "Hexágono"]] },
      { key: "terrainNodeColor", label: "Preenchimento", type: "color" },
      { key: "terrainNodeStrokeColor", label: "Cor do contorno", type: "color" },
      { key: "terrainNodeSize", label: "Tamanho", type: "range", min: 10, max: 68, step: 1, unit: "u" },
      { key: "terrainNodeStrokeWidth", label: "Espessura do contorno", type: "range", min: 0, max: 12, step: 0.5, unit: "u" },
      { key: "terrainNodeFillOpacity", label: "Opacidade do preenchimento", type: "range", min: 0, max: 100, step: 5, unit: "%" },
      { key: "terrainNodeStrokeOpacity", label: "Opacidade do contorno", type: "range", min: 0, max: 100, step: 5, unit: "%" },
    ],
    keys: ["terrainNodeShape", "terrainNodeColor", "terrainNodeStrokeColor", "terrainNodeSize", "terrainNodeStrokeWidth", "terrainNodeFillOpacity", "terrainNodeStrokeOpacity"],
  },
  confirmButton: {
    title: "Confirmar percurso", icon: "✓",
    fields: [
      { key: "confirmButtonColor", label: "Fundo", type: "color" },
      { key: "confirmButtonIconColor", label: "Ícone", type: "color" },
      { key: "buttonSize", label: "Tamanho dos botões", type: "range", min: 20, max: 60, step: 1, unit: "u" },
      { key: "buttonGap", label: "Espaço entre botões", type: "range", min: 0, max: 24, step: 1, unit: "u" },
      { key: "buttonIconScale", label: "Tamanho do ícone", type: "range", min: 35, max: 95, step: 5, unit: "%" },
      { key: "buttonBorderColor", label: "Cor do contorno", type: "color" },
      { key: "buttonBorderWidth", label: "Espessura do contorno", type: "range", min: 0, max: 8, step: 0.5, unit: "u" },
    ],
    keys: ["confirmButtonColor", "confirmButtonIconColor", "buttonSize", "buttonGap", "buttonIconScale", "buttonBorderColor", "buttonBorderWidth"],
  },
  cancelButton: {
    title: "Cancelar percurso", icon: "✕",
    fields: [
      { key: "cancelButtonColor", label: "Fundo", type: "color" },
      { key: "cancelButtonIconColor", label: "Ícone", type: "color" },
      { key: "buttonSize", label: "Tamanho dos botões", type: "range", min: 20, max: 60, step: 1, unit: "u" },
      { key: "buttonGap", label: "Espaço entre botões", type: "range", min: 0, max: 24, step: 1, unit: "u" },
      { key: "buttonIconScale", label: "Tamanho do ícone", type: "range", min: 35, max: 95, step: 5, unit: "%" },
      { key: "buttonBorderColor", label: "Cor do contorno", type: "color" },
      { key: "buttonBorderWidth", label: "Espessura do contorno", type: "range", min: 0, max: 8, step: 0.5, unit: "u" },
    ],
    keys: ["cancelButtonColor", "cancelButtonIconColor", "buttonSize", "buttonGap", "buttonIconScale", "buttonBorderColor", "buttonBorderWidth"],
  },
  terrainButton: {
    title: "Terreno difícil", icon: "TD",
    fields: [
      { key: "terrainButtonColor", label: "Fundo", type: "color" },
      { key: "terrainButtonIconColor", label: "Ícone", type: "color" },
      { key: "buttonSize", label: "Tamanho dos botões", type: "range", min: 20, max: 60, step: 1, unit: "u" },
      { key: "buttonGap", label: "Espaço entre botões", type: "range", min: 0, max: 24, step: 1, unit: "u" },
      { key: "buttonIconScale", label: "Tamanho do ícone", type: "range", min: 35, max: 95, step: 5, unit: "%" },
      { key: "buttonBorderColor", label: "Cor do contorno", type: "color" },
      { key: "buttonBorderWidth", label: "Espessura do contorno", type: "range", min: 0, max: 8, step: 0.5, unit: "u" },
    ],
    keys: ["terrainButtonColor", "terrainButtonIconColor", "buttonSize", "buttonGap", "buttonIconScale", "buttonBorderColor", "buttonBorderWidth"],
  },
  circleArea: {
    title: "Área circular", icon: "◯",
    fields: [
      { key: "circleAreaFillColor", label: "Preenchimento", type: "color" },
      { key: "circleAreaFillOpacity", label: "Opacidade do preenchimento", type: "range", min: 0, max: 100, step: 5, unit: "%" },
      { key: "circleAreaStrokeColor", label: "Cor do contorno", type: "color" },
      { key: "circleAreaStrokeOpacity", label: "Opacidade do contorno", type: "range", min: 0, max: 100, step: 5, unit: "%" },
      { key: "circleAreaStrokeWidth", label: "Espessura do contorno", type: "range", min: 0, max: 12, step: 0.5, unit: "u" },
    ],
    keys: ["circleAreaFillColor", "circleAreaFillOpacity", "circleAreaStrokeColor", "circleAreaStrokeOpacity", "circleAreaStrokeWidth"],
  },
  coneArea: {
    title: "Cone", icon: "◢",
    fields: [
      { key: "coneAreaFillColor", label: "Preenchimento", type: "color" },
      { key: "coneAreaFillOpacity", label: "Opacidade do preenchimento", type: "range", min: 0, max: 100, step: 5, unit: "%" },
      { key: "coneAreaStrokeColor", label: "Cor do contorno", type: "color" },
      { key: "coneAreaStrokeOpacity", label: "Opacidade do contorno", type: "range", min: 0, max: 100, step: 5, unit: "%" },
      { key: "coneAreaStrokeWidth", label: "Espessura do contorno", type: "range", min: 0, max: 12, step: 0.5, unit: "u" },
    ],
    keys: ["coneAreaFillColor", "coneAreaFillOpacity", "coneAreaStrokeColor", "coneAreaStrokeOpacity", "coneAreaStrokeWidth"],
  },
  areaIndicator: {
    title: "Indicador de distância da área", icon: "↔",
    fields: [
      { key: "areaIndicatorBackgroundColor", label: "Fundo", type: "color" },
      { key: "areaIndicatorTextColor", label: "Texto", type: "color" },
      { key: "areaIndicatorBorderColor", label: "Cor do contorno", type: "color" },
      { key: "areaIndicatorWidth", label: "Largura", type: "range", min: 70, max: 240, step: 2, unit: "u" },
      { key: "areaIndicatorHeight", label: "Altura", type: "range", min: 18, max: 50, step: 1, unit: "u" },
      { key: "areaIndicatorFontSize", label: "Tamanho do texto", type: "range", min: 7, max: 30, step: 1, unit: "u" },
      { key: "areaIndicatorBorderWidth", label: "Espessura do contorno", type: "range", min: 0, max: 8, step: 0.5, unit: "u" },
      { key: "areaIndicatorOpacity", label: "Opacidade", type: "range", min: 10, max: 100, step: 5, unit: "%" },
    ],
    keys: ["areaIndicatorBackgroundColor", "areaIndicatorTextColor", "areaIndicatorBorderColor", "areaIndicatorWidth", "areaIndicatorHeight", "areaIndicatorFontSize", "areaIndicatorBorderWidth", "areaIndicatorOpacity"],
  },
  indicator: {
    title: "Indicador de distância", icon: "↔",
    fields: [
      { key: "indicatorBackgroundColor", label: "Fundo", type: "color" },
      { key: "indicatorTextColor", label: "Texto", type: "color" },
      { key: "indicatorBorderColor", label: "Cor do contorno", type: "color" },
      { key: "indicatorWidth", label: "Largura", type: "range", min: 70, max: 240, step: 2, unit: "u" },
      { key: "indicatorHeight", label: "Altura", type: "range", min: 18, max: 50, step: 1, unit: "u" },
      { key: "indicatorFontSize", label: "Tamanho do texto", type: "range", min: 7, max: 30, step: 1, unit: "u" },
      { key: "indicatorBorderWidth", label: "Espessura do contorno", type: "range", min: 0, max: 8, step: 0.5, unit: "u" },
      { key: "indicatorOpacity", label: "Opacidade", type: "range", min: 10, max: 100, step: 5, unit: "%" },
    ],
    keys: ["indicatorBackgroundColor", "indicatorTextColor", "indicatorBorderColor", "indicatorWidth", "indicatorHeight", "indicatorFontSize", "indicatorBorderWidth", "indicatorOpacity"],
  },
};

let style = { ...DEFAULTS };
let activeComponent = null;
let loaded = false;
let writeTimer = null;
let writeQueue = Promise.resolve();
let pendingSave = null;
let lastAppearanceUpdatedAt = 0;
const dialog = document.querySelector("#editorDialog");
const fieldsRoot = document.querySelector("#editorFields");
const status = document.querySelector("#status");
const PREVIEW_CELL_SIZE = 56;
const PREVIEW_ZOOM = 1;
const PREVIEW_WIDTH = 560;
const PREVIEW_HEIGHT = 420;
const PREVIEW_CENTER_X = PREVIEW_WIDTH / 2;
const PREVIEW_CENTER_Y = PREVIEW_HEIGHT / 2;
// Eight columns by six rows, displayed in landscape orientation.
const PREVIEW_POINTS = [{ x: 168, y: 266 }, { x: 336, y: 154 }];
const requestedPreviewTool = new URLSearchParams(window.location.search).get("tool");
const settingsMode = requestedPreviewTool === "route" ? "route" : "areas";
let activePreviewTool = ["route", "circle", "cone"].includes(requestedPreviewTool) ? requestedPreviewTool : "cone";
if (settingsMode === "areas" && activePreviewTool === "route") activePreviewTool = "cone";
let previewDpi = 70;
let selectedElement = activePreviewTool === "circle" ? "circleArea" : activePreviewTool === "cone" ? "coneArea" : null;
function previewScale() { return PREVIEW_CELL_SIZE / (Number.isFinite(previewDpi) && previewDpi > 0 ? previewDpi : 70); }

function clamp(value, min, max, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}
function isHexColor(value) { return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value); }
function formatNumber(value) { return Number(value).toLocaleString("pt-BR", { maximumFractionDigits: 1 }); }
function formatValue(field, value) {
  if (field.type === "color") return String(value).toUpperCase();
  if (field.type === "range") return `${formatNumber(value)} ${field.unit || ""}`.trim();
  return "";
}
function migrateLegacyDefaults(input = {}) {
  const migrated = { ...(input || {}) };
  const legacyEntries = Object.entries(LEGACY_DEFAULTS);
  // Do not migrate individual matching values: a player may have intentionally
  // chosen one of the former defaults as a custom button color.
  const isEntireLegacyPalette = legacyEntries.every(([key, value]) => migrated[key] === value);
  if (isEntireLegacyPalette) {
    for (const [key] of legacyEntries) migrated[key] = DEFAULTS[key];
  }
  const legacyAreaKeys = Object.keys(LEGACY_AREA_DEFAULTS);
  const hasLegacyAreaStyle = legacyAreaKeys.some((key) => Object.prototype.hasOwnProperty.call(migrated, key));
  if (hasLegacyAreaStyle) {
    const isOldRedPreset = legacyAreaKeys.every((key) => migrated[key] === LEGACY_AREA_DEFAULTS[key]);
    const suffixes = ["FillColor", "FillOpacity", "StrokeColor", "StrokeOpacity", "StrokeWidth"];
    for (const suffix of suffixes) {
      const legacyKey = `area${suffix}`;
      const fallback = DEFAULTS[`circleArea${suffix}`];
      const value = isOldRedPreset ? fallback : (migrated[legacyKey] ?? fallback);
      for (const prefix of ["circleArea", "coneArea"]) {
        const key = `${prefix}${suffix}`;
        if (migrated[key] === undefined) migrated[key] = value;
      }
      delete migrated[legacyKey];
    }
  }
  return migrated;
}

function normaliseStyle(input = {}) {
  const output = { ...DEFAULTS, ...(input || {}) };
  for (const [key, value] of Object.entries(DEFAULTS)) {
    if (key.toLowerCase().includes("color")) output[key] = isHexColor(output[key]) ? output[key] : value;
    else if (typeof value === "number") {
      const schema = Object.values(COMPONENTS).flatMap((component) => component.fields).find((field) => field.key === key && field.type === "range");
      output[key] = schema ? clamp(output[key], schema.min, schema.max, value) : Number(output[key]) || value;
    }
  }
  if (!["SOLID", "DASHED", "DOTTED"].includes(output.lineStyle)) output.lineStyle = DEFAULTS.lineStyle;
  if (!["CIRCLE", "RECTANGLE", "TRIANGLE", "HEXAGON"].includes(output.nodeShape)) output.nodeShape = DEFAULTS.nodeShape;
  if (!["CIRCLE", "RECTANGLE", "TRIANGLE", "HEXAGON"].includes(output.terrainNodeShape)) output.terrainNodeShape = DEFAULTS.terrainNodeShape;
  return output;
}

function renderField(field) {
  const value = style[field.key];
  if (field.type === "color") {
    return `<label class="field field-color" for="field-${field.key}"><span class="field-top"><span class="field-label">${field.label}</span><output id="output-${field.key}">${formatValue(field, value)}</output></span><input id="field-${field.key}" data-key="${field.key}" type="color" value="${value}" /></label>`;
  }
  if (field.type === "select") {
    const options = field.options.map(([key, label]) => `<option value="${key}" ${value === key ? "selected" : ""}>${label}</option>`).join("");
    return `<label class="field field-select" for="field-${field.key}"><span class="field-top"><span class="field-label">${field.label}</span></span><select id="field-${field.key}" data-key="${field.key}">${options}</select></label>`;
  }
  return `<label class="field field-range" for="field-${field.key}"><span class="field-top"><span class="field-label">${field.label}</span><output id="output-${field.key}">${formatValue(field, value)}</output></span><input id="field-${field.key}" data-key="${field.key}" type="range" min="${field.min}" max="${field.max}" step="${field.step}" value="${value}" /></label>`;
}

function openComponent(key) {
  const component = COMPONENTS[key];
  if (!component) return;
  activeComponent = key;
  document.querySelector("#editorTitle").textContent = component.title;
  document.querySelector("#editorIcon").textContent = component.icon;
  fieldsRoot.innerHTML = component.fields.map(renderField).join("");
  fieldsRoot.querySelectorAll("[data-key]").forEach((input) => {
    input.addEventListener("input", onFieldChange);
    input.addEventListener("change", onFieldChange);
  });
  selectedElement = key;
  updateSelectedElement();
  if (!dialog.open) dialog.showModal();
}

function onFieldChange(event) {
  const input = event.currentTarget;
  const key = input.dataset.key;
  if (!key || !(key in style)) return;
  const field = Object.values(COMPONENTS).flatMap((component) => component.fields).find((item) => item.key === key);
  style[key] = field?.type === "range" ? Number(input.value) : input.value;
  const output = document.querySelector(`#output-${CSS.escape(key)}`);
  if (output) output.value = formatValue(field || { type: input.type }, style[key]);
  drawPreview();
  scheduleMetadataUpdate();
}

function localAppearanceStorageKey() {
  return `${LOCAL_APPEARANCE_STORAGE_PREFIX}${OBR.player?.id || "current-player"}`;
}

function writeLocalAppearance(next, updatedAt) {
  try {
    localStorage.setItem(localAppearanceStorageKey(), JSON.stringify({ style: next, updatedAt }));
  } catch (error) {
    console.warn("Não foi possível manter uma cópia local da aparência.", error);
  }
}

function flushMetadataUpdate() {
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = null;
  const update = pendingSave;
  pendingSave = null;
  if (!update) return writeQueue;
  writeQueue = writeQueue.then(async () => {
    await OBR.player.setMetadata({
      [APPEARANCE_METADATA_KEY]: update.style,
      [APPEARANCE_UPDATED_AT_KEY]: update.updatedAt,
    });
    await OBR.broadcast.sendMessage(APPEARANCE_BROADCAST_CHANNEL, {
      type: "appearance-update",
      metadata: update.style,
      updatedAt: update.updatedAt,
    }, { destination: "LOCAL" });
    status.textContent = "Salvo";
    status.style.color = "#8fcaad";
  }).catch((error) => {
    console.error("Falha ao salvar a aparência pessoal", error);
    // The local copy was saved synchronously on input and will be restored on
    // the next open, even if Owlbear metadata temporarily fails.
    status.textContent = "Salvo localmente";
    status.style.color = "#d9b77b";
  });
  return writeQueue;
}

function scheduleMetadataUpdate() {
  if (!loaded) return;
  status.textContent = "Salvando…";
  status.style.color = "#d9b77b";
  const updatedAt = Math.max(Date.now(), lastAppearanceUpdatedAt + 1);
  lastAppearanceUpdatedAt = updatedAt;
  const next = { ...style };
  // Persist locally before debounce. Closing the popover can therefore never
  // discard the latest color/size choice merely because metadata was still queued.
  writeLocalAppearance(next, updatedAt);
  pendingSave = { style: next, updatedAt };
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(() => { void flushMetadataUpdate(); }, 120);
}

function resetCurrentComponent() {
  if (!activeComponent) return;
  const component = COMPONENTS[activeComponent];
  for (const key of component.keys) style[key] = DEFAULTS[key];
  // Rebuild the current editor so every input and output agrees with the defaults.
  openComponent(activeComponent);
  drawPreview();
  scheduleMetadataUpdate();
}

function createSvgElement(name, attributes = {}, className = "") {
  const element = document.createElementNS("http://www.w3.org/2000/svg", name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
  if (className) element.setAttribute("class", className);
  return element;
}

function pointsForShape(shape, cx, cy, size) {
  if (shape === "RECTANGLE") return `${cx-size/2},${cy-size/2} ${cx+size/2},${cy-size/2} ${cx+size/2},${cy+size/2} ${cx-size/2},${cy+size/2}`;
  if (shape === "TRIANGLE") return `${cx},${cy-size/2} ${cx+size/2},${cy+size/2} ${cx-size/2},${cy+size/2}`;
  const points = [];
  const sides = shape === "HEXAGON" ? 6 : 8;
  for (let i = 0; i < sides; i++) {
    const angle = -Math.PI / 2 + (Math.PI * 2 * i) / sides;
    points.push(`${cx + Math.cos(angle) * size/2},${cy + Math.sin(angle) * size/2}`);
  }
  return points.join(" ");
}

function renderPreviewNode(groupId, shape, color, strokeColor, size, strokeWidth, fillOpacity, strokeOpacity, positions) {
  const group = document.getElementById(groupId);
  group.replaceChildren();
  const scale = previewScale();
  const visualSize = Math.max(1, size * scale);
  for (const { x: cx, y: cy } of positions) {
    let visual;
    if (shape === "CIRCLE") visual = createSvgElement("circle", { cx, cy, r: visualSize / 2 });
    else visual = createSvgElement("polygon", { points: pointsForShape(shape, cx, cy, visualSize) });
    visual.setAttribute("fill", color);
    visual.setAttribute("stroke", strokeColor);
    visual.setAttribute("stroke-width", Math.max(0, strokeWidth * scale));
    visual.setAttribute("fill-opacity", fillOpacity / 100);
    visual.setAttribute("stroke-opacity", strokeOpacity / 100);
    group.appendChild(visual);
    // Generous transparent target makes the small, grid-scaled node easy to select.
    group.appendChild(createSvgElement("circle", { cx, cy, r: Math.max(8, visualSize / 2 + 2), fill: "transparent", stroke: "none", "pointer-events": "all" }));
  }
}

function createPreviewCellSet(tool) {
  const cells = new Set();
  if (tool === "cone") {
    // The agreed 5 m cone raster, on a 6-column × 5-row footprint.
    // Every '+' is a whole cell; '-' cells stay outside the shape.
    const rows = ["----+-", "--++++", "++++++", "--++++", "----+-"];
    rows.forEach((row, rowIndex) => {
      [...row].forEach((character, columnIndex) => {
        if (character === "+") cells.add(`${columnIndex},${rowIndex - 2}`);
      });
    });
    return cells;
  }
  for (let q = -5; q <= 5; q++) {
    for (let r = -5; r <= 5; r++) {
      if (Math.max(Math.abs(q), Math.abs(r)) > 5) continue;
      if (Math.hypot(q, r) <= 2.5) cells.add(`${q},${r}`);
    }
  }
  return cells;
}
function buildAreaPreviewPath(tool) {
  const cells = createPreviewCellSet(tool);
  const originX = tool === "cone" ? 84 : 252;
  const originY = tool === "cone" ? 182 : 238;
  const size = PREVIEW_CELL_SIZE;
  const edges = [];
  const has = (q, r) => cells.has(`${q},${r}`);
  const addEdge = (from, to) => edges.push({ from, to, used: false });
  for (const key of cells) {
    const [q, r] = key.split(",").map(Number);
    const left = originX + q * size - size / 2;
    const right = left + size;
    const top = originY + r * size - size / 2;
    const bottom = top + size;
    if (!has(q, r - 1)) addEdge({ x: left, y: top }, { x: right, y: top });
    if (!has(q + 1, r)) addEdge({ x: right, y: top }, { x: right, y: bottom });
    if (!has(q, r + 1)) addEdge({ x: right, y: bottom }, { x: left, y: bottom });
    if (!has(q - 1, r)) addEdge({ x: left, y: bottom }, { x: left, y: top });
  }
  const pointKey = (p) => `${Math.round(p.x * 1000) / 1000},${Math.round(p.y * 1000) / 1000}`;
  const outgoing = new Map();
  edges.forEach((edge, index) => {
    const key = pointKey(edge.from);
    if (!outgoing.has(key)) outgoing.set(key, []);
    outgoing.get(key).push(index);
  });
  const paths = [];
  for (let i = 0; i < edges.length; i++) {
    if (edges[i].used) continue;
    const start = edges[i].from;
    let currentIndex = i;
    const points = [];
    let guard = 0;
    while (!edges[currentIndex].used && guard++ < edges.length + 5) {
      const edge = edges[currentIndex];
      edge.used = true;
      points.push(edge.from);
      const endKey = pointKey(edge.to);
      if (endKey === pointKey(start)) break;
      const next = (outgoing.get(endKey) || []).find((idx) => !edges[idx].used);
      if (next === undefined) break;
      currentIndex = next;
    }
    if (points.length >= 3) paths.push(`M ${points.map((p) => `${p.x} ${p.y}`).join(" L ")} Z`);
  }
  return paths.join(" ");
}

function drawPreview() {
  const scale = previewScale();
  const areaPrefix = activePreviewTool === "circle" ? "circleArea" : "coneArea";
  const previewArea = document.querySelector("#previewAreaShape");
  const previewAreaGroup = document.querySelector("#previewAreaGroup");
  if (previewArea) {
    previewArea.setAttribute("d", buildAreaPreviewPath(activePreviewTool));
    previewArea.setAttribute("fill", style[`${areaPrefix}FillColor`]);
    previewArea.setAttribute("fill-opacity", style[`${areaPrefix}FillOpacity`] / 100);
    previewArea.setAttribute("stroke", style[`${areaPrefix}StrokeColor`]);
    previewArea.setAttribute("stroke-opacity", style[`${areaPrefix}StrokeOpacity`] / 100);
    previewArea.setAttribute("stroke-width", Math.max(0, style[`${areaPrefix}StrokeWidth`] * scale));
  }
  if (previewAreaGroup) {
    previewAreaGroup.dataset.element = areaPrefix === "circleArea" ? "circleArea" : "coneArea";
    previewAreaGroup.setAttribute("aria-label", areaPrefix === "circleArea" ? "Personalizar área circular" : "Personalizar cone");
  }
  const indicatorHotspot = document.querySelector(".indicator-hotspot");
  const indicatorPrefix = activePreviewTool === "route" ? "indicator" : "areaIndicator";
  if (indicatorHotspot) {
    indicatorHotspot.dataset.element = activePreviewTool === "route" ? "indicator" : "areaIndicator";
    indicatorHotspot.setAttribute("aria-label", activePreviewTool === "route" ? "Personalizar indicador de distância" : "Personalizar indicador de distância da área");
  }
  document.querySelector(".header-copy h1").textContent = settingsMode === "route" ? "Personalização da régua" : "Personalização das áreas";
  document.querySelector(".tool-tabs").style.display = settingsMode === "route" ? "none" : "grid";
  document.querySelectorAll("[data-tool-tab]").forEach((tab) => {
    tab.hidden = settingsMode === "route" || tab.dataset.toolTab === "route";
  });
  document.querySelectorAll("[data-preview-view]").forEach((element) => {
    const view = element.dataset.previewView;
    if (view === "shared") element.style.display = "";
    else if (view === "route") element.style.display = activePreviewTool === "route" ? "" : "none";
    else element.style.display = activePreviewTool === "route" ? "none" : "";
  });
  document.querySelectorAll("[data-tool-tab]").forEach((tab) => {
    const selected = tab.dataset.toolTab === activePreviewTool;
    tab.classList.toggle("is-active", selected);
    tab.setAttribute("aria-selected", String(selected));
  });
  const anchor = activePreviewTool === "route"
    ? PREVIEW_POINTS[PREVIEW_POINTS.length - 1]
    : { x: 420, y: 350 };
  const pathData = PREVIEW_POINTS.map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`).join(" ");
  const line = document.querySelector("#previewLine");
  const lineHit = document.querySelector("#previewLineHit");
  line.setAttribute("d", pathData);
  lineHit.setAttribute("d", pathData);
  line.setAttribute("stroke", style.lineColor);
  line.setAttribute("stroke-width", Math.max(0.6, style.lineWidth * scale));
  line.setAttribute("opacity", style.lineOpacity / 100);
  let dash = [];
  if (style.lineStyle === "DOTTED") dash = [Math.max(1.5, style.lineWidth * 0.25), Math.max(4, style.lineWidth * 1.2)].map((value) => value * scale);
  else if (style.lineStyle === "DASHED") dash = [Math.max(8, style.lineWidth * 2.2), Math.max(5, style.lineWidth * 1.35)].map((value) => value * scale);
  line.setAttribute("stroke-dasharray", dash.length ? dash.join(" ") : "none");

  renderPreviewNode("previewNodeGroup", style.nodeShape, style.nodeColor, style.nodeStrokeColor, style.nodeSize, style.nodeStrokeWidth, style.nodeFillOpacity, style.nodeStrokeOpacity, [PREVIEW_POINTS[0]]);
  renderPreviewNode("previewTerrainNodeGroup", style.terrainNodeShape, style.terrainNodeColor, style.terrainNodeStrokeColor, style.terrainNodeSize, style.terrainNodeStrokeWidth, style.terrainNodeFillOpacity, style.terrainNodeStrokeOpacity, [anchor]);

  const anchorNodeSize = style.terrainNodeSize * scale;
  const indicatorWidth = style[`${indicatorPrefix}Width`] * scale;
  const indicatorHeight = style[`${indicatorPrefix}Height`] * scale;
  const zoomLeftLimit = PREVIEW_CENTER_X * (1 - 1 / PREVIEW_ZOOM);
  const zoomRightLimit = PREVIEW_CENTER_X + (PREVIEW_WIDTH - PREVIEW_CENTER_X) / PREVIEW_ZOOM;
  const indicatorHalfWidth = indicatorWidth / 2 + (style[`${indicatorPrefix}BorderWidth`] * scale) / 2 + 1;
  const indicatorCenterX = Math.max(zoomLeftLimit + indicatorHalfWidth, Math.min(zoomRightLimit - indicatorHalfWidth, anchor.x));
  let indicatorCenterY = anchor.y - anchorNodeSize / 2 - 8 * scale - indicatorHeight / 2;

  const buttonSize = style.buttonSize * scale;
  const buttonGap = style.buttonGap * scale;
  const rowWidth = buttonSize * 3 + buttonGap * 2;
  // Clamp the full row to the preview viewport after zooming so complete button circles remain visible.
  const rowMinX = zoomLeftLimit;
  const rowMaxX = zoomRightLimit - rowWidth;
  const rowLeft = Math.max(rowMinX, Math.min(rowMaxX, indicatorCenterX - rowWidth / 2));
  const centersX = [
    rowLeft + buttonSize / 2,
    rowLeft + buttonSize / 2 + buttonSize + buttonGap,
    rowLeft + buttonSize / 2 + (buttonSize + buttonGap) * 2,
  ];
  const buttonYRaw = indicatorCenterY - indicatorHeight / 2 - 6 * scale - buttonSize / 2;
  // Move the stack down only when needed to keep the button rims inside the zoomed viewport.
  const minimumButtonY = PREVIEW_CENTER_Y + buttonSize / 2 - PREVIEW_CENTER_Y / PREVIEW_ZOOM;
  const buttonY = Math.max(buttonYRaw, minimumButtonY);
  indicatorCenterY += buttonY - buttonYRaw;

  const body = document.querySelector("#previewIndicatorBody");
  body.setAttribute("x", indicatorCenterX - indicatorWidth / 2);
  body.setAttribute("y", indicatorCenterY - indicatorHeight / 2);
  body.setAttribute("width", indicatorWidth);
  body.setAttribute("height", indicatorHeight);
  body.setAttribute("rx", indicatorHeight / 2);
  body.setAttribute("fill", style[`${indicatorPrefix}BackgroundColor`]);
  body.setAttribute("fill-opacity", style[`${indicatorPrefix}Opacity`] / 100);
  body.setAttribute("stroke", style[`${indicatorPrefix}BorderColor`]);
  body.setAttribute("stroke-width", style[`${indicatorPrefix}BorderWidth`] * scale);

  const indicatorText = document.querySelector("#previewIndicatorText");
  indicatorText.setAttribute("x", indicatorCenterX);
  indicatorText.setAttribute("y", indicatorCenterY);
  indicatorText.setAttribute("font-size", Math.max(2.5, style[`${indicatorPrefix}FontSize`] * scale));
  indicatorText.setAttribute("fill", style[`${indicatorPrefix}TextColor`]);
  indicatorText.setAttribute("dominant-baseline", "central");
  indicatorText.textContent = activePreviewTool === "route" ? "2 m" : "5 m";

  const buttonConfigs = [
    ["previewConfirmBg", "previewConfirmIcon", centersX[0], style.confirmButtonColor, style.confirmButtonIconColor, "✓"],
    ["previewCancelBg", "previewCancelIcon", centersX[1], style.cancelButtonColor, style.cancelButtonIconColor, "✕"],
    ["previewTerrainBg", "previewTerrainIcon", centersX[2], style.terrainButtonColor, style.terrainButtonIconColor, null],
  ];
  for (const [bgId, iconId, x, bgColor, iconColor, glyph] of buttonConfigs) {
    const bg = document.getElementById(bgId);
    bg.setAttribute("cx", x);
    bg.setAttribute("cy", buttonY);
    bg.setAttribute("r", buttonSize / 2);
    bg.setAttribute("fill", bgColor);
    bg.setAttribute("stroke", style.buttonBorderColor);
    bg.setAttribute("stroke-width", style.buttonBorderWidth * scale);
    bg.setAttribute("stroke-opacity", style.buttonBorderWidth > 0 ? 1 : 0);

    const icon = document.getElementById(iconId);
    if (glyph) {
      // SVG text uses its baseline differently across fonts; central baseline plus a smaller glyph box keeps ✓ and ✕ centered.
      icon.setAttribute("x", x);
      icon.setAttribute("y", buttonY);
      icon.setAttribute("fill", iconColor);
      icon.setAttribute("font-size", Math.max(3, buttonSize * Math.min(0.62, style.buttonIconScale / 100 * 0.86)));
      icon.setAttribute("dominant-baseline", "central");
      icon.textContent = glyph;
    } else {
      const iconScale = style.buttonIconScale / 72;
      const side = buttonSize * 0.32 * iconScale;
      const offset = side * 0.32;
      const stroke = Math.max(0.6, buttonSize * 0.035 * iconScale);
      const frontX = x - offset / 2;
      const frontY = buttonY + offset / 2;
      const left = frontX - side / 2;
      const right = frontX + side / 2;
      const top = frontY - side / 2;
      const bottom = frontY + side / 2;
      const backLeft = left + offset;
      const backRight = right + offset;
      const backTop = top - offset;
      const backBottom = bottom - offset;
      icon.setAttribute("d", `M ${left} ${top} H ${right} V ${bottom} H ${left} Z M ${backLeft} ${backTop} H ${backRight} M ${backRight} ${backTop} V ${backBottom}`);
      icon.setAttribute("fill", "none");
      icon.setAttribute("stroke", iconColor);
      icon.setAttribute("stroke-width", stroke);
    }
  }
  updateSelectedElement();
}

function updateSelectedElement() {
  document.querySelectorAll("#mapPreview [data-element]").forEach((element) => {
    element.classList.toggle("is-selected", element.dataset.element === selectedElement);
  });
}

function handlePreviewSelection(target) {
  const component = target?.closest?.("[data-element]");
  if (component && COMPONENTS[component.dataset.element]) openComponent(component.dataset.element);
}

document.querySelectorAll("[data-tool-tab]").forEach((tab) => {
  tab.addEventListener("click", () => {
    activePreviewTool = tab.dataset.toolTab;
    selectedElement = activePreviewTool === "circle" ? "circleArea" : activePreviewTool === "cone" ? "coneArea" : null;
    updateSelectedElement();
    drawPreview();
  });
});

document.querySelector("#mapPreview").addEventListener("click", (event) => handlePreviewSelection(event.target));
document.querySelector("#mapPreview").addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const component = event.target.closest?.("[data-element]");
  if (!component) return;
  event.preventDefault();
  handlePreviewSelection(component);
});
document.querySelector("#resetElement").addEventListener("click", resetCurrentComponent);
document.querySelector("#resetAll").addEventListener("click", () => {
  const isAreaKey = (key) => key.startsWith("circleArea") || key.startsWith("coneArea") || key.startsWith("areaIndicator");
  const keysToReset = Object.keys(DEFAULTS).filter((key) => settingsMode === "areas" ? isAreaKey(key) : !isAreaKey(key));
  for (const key of keysToReset) style[key] = DEFAULTS[key];
  if (activeComponent) openComponent(activeComponent);
  drawPreview();
  scheduleMetadataUpdate();
});

async function loadPreferences() {
  let playerMetadata = null;
  try {
    playerMetadata = await OBR.player.getMetadata();
  } catch (error) {
    console.warn("Não foi possível carregar os metadados pessoais", error);
  }
  let local = null;
  try {
    const raw = localStorage.getItem(localAppearanceStorageKey());
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed?.style && typeof parsed.style === "object") {
      local = { style: normaliseStyle(migrateLegacyDefaults(parsed.style)), updatedAt: Number(parsed.updatedAt) || 0 };
    }
  } catch { /* Use the synced metadata if the local copy is unavailable. */ }

  const remoteRaw = playerMetadata?.[APPEARANCE_METADATA_KEY];
  const remoteStyle = remoteRaw && typeof remoteRaw === "object"
    ? normaliseStyle(migrateLegacyDefaults(remoteRaw)) : null;
  const remoteUpdatedAt = Number(playerMetadata?.[APPEARANCE_UPDATED_AT_KEY]) || 0;
  const useLocal = Boolean(local && (!remoteStyle || local.updatedAt > remoteUpdatedAt));
  if (useLocal) {
    style = { ...local.style };
    lastAppearanceUpdatedAt = local.updatedAt;
    try {
      await OBR.player.setMetadata({
        [APPEARANCE_METADATA_KEY]: style,
        [APPEARANCE_UPDATED_AT_KEY]: local.updatedAt,
      });
      await OBR.broadcast.sendMessage(APPEARANCE_BROADCAST_CHANNEL, {
        type: "appearance-update", metadata: style, updatedAt: local.updatedAt,
      }, { destination: "LOCAL" });
    } catch (error) {
      console.warn("Mantendo a aparência local até os metadados sincronizarem", error);
    }
  } else if (remoteStyle) {
    style = { ...remoteStyle };
    lastAppearanceUpdatedAt = remoteUpdatedAt;
    if (remoteUpdatedAt > 0) writeLocalAppearance(style, remoteUpdatedAt);
  } else if (local) {
    style = { ...local.style };
    lastAppearanceUpdatedAt = local.updatedAt;
  } else {
    style = { ...DEFAULTS };
    lastAppearanceUpdatedAt = 0;
  }

  try {
    const dpi = await OBR.scene.grid.getDpi();
    previewDpi = Number.isFinite(Number(dpi)) && Number(dpi) > 0 ? Number(dpi) : 70;
  } catch (error) {
    console.warn("Não foi possível ler a escala da grade para a prévia", error);
    previewDpi = 70;
  }
  drawPreview();
  loaded = true;
}

window.addEventListener("pagehide", () => { void flushMetadataUpdate(); });
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") void flushMetadataUpdate();
});

OBR.onReady(async () => {
  await loadPreferences();
});
