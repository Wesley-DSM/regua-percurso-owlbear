import OBR, { buildCurve, buildShape, buildText } from "@owlbear-rodeo/sdk";
import { computeAreaGeometry, discoverIsometricBasis, getDefaultGridBasis } from "./area-geometry.js";

const APP_BASE_URL = import.meta.env.BASE_URL;
const appAsset = (path) => `${APP_BASE_URL}${path.replace(/^\/+/, "")}`;

const EXTENSION_ID = "com.wesleydsm.agentesaparicoes.ruler";
const TOOL_ID = `${EXTENSION_ID}/tool`;
const MODE_ID = `${EXTENSION_ID}/draw-mode`;
const SHAPES_TOOL_ID = `${EXTENSION_ID}/shapes-tool`;
const CIRCLE_MODE_ID = `${EXTENSION_ID}/shapes-circle-mode`;
const CONE_MODE_ID = `${EXTENSION_ID}/shapes-cone-mode`;
const SHAPE_SETTINGS_ACTION_ID = `${EXTENSION_ID}/shapes-appearance-action`;
const MAX_AREA_CELLS = 2500;
const MAX_AREA_RADIUS = 50;
const SETTINGS_ACTION_ID = `${EXTENSION_ID}/appearance-action`;
const SETTINGS_POPOVER_ID = `${EXTENSION_ID}/appearance-popover`;
const APPEARANCE_BROADCAST_CHANNEL = `${EXTENSION_ID}/appearance-update`;
const APPEARANCE_METADATA_KEY = `${EXTENSION_ID}/appearance`;
const APPEARANCE_UPDATED_AT_KEY = `${EXTENSION_ID}/appearanceUpdatedAt`;
const LOCAL_APPEARANCE_STORAGE_PREFIX = `${EXTENSION_ID}:appearance:`;
const KEY_AREA_ID = `${EXTENSION_ID}/areaId`;
const KEY_AREA_TYPE = `${EXTENSION_ID}/areaType`;
const KEY_KIND = `${EXTENSION_ID}/kind`;
const KEY_ROUTE = `${EXTENSION_ID}/routeId`;
const KEY_ACTION = `${EXTENSION_ID}/action`;
const KEY_CREATED = `${EXTENSION_ID}/createdBy`;
const KEY_DISTANCE_TEXT = `${EXTENSION_ID}/distanceText`;
const KEY_ANCHOR_HALF_HEIGHT = `${EXTENSION_ID}/anchorHalfHeight`;
const KEY_NODE_CENTER_X = `${EXTENSION_ID}/nodeCenterX`;
const KEY_NODE_CENTER_Y = `${EXTENSION_ID}/nodeCenterY`;

const DEFAULT_STYLE = {
  lineColor: "#20242D",
  lineWidth: 8,
  lineStyle: "DASHED",
  lineOpacity: 100,
  nodeColor: "#F0F1EF",
  nodeStrokeColor: "#20242D",
  nodeSize: 26,
  nodeShape: "CIRCLE",
  nodeStrokeWidth: 5,
  nodeFillOpacity: 100,
  nodeStrokeOpacity: 100,
  terrainNodeColor: "#D8E0DA",
  terrainNodeStrokeColor: "#20242D",
  terrainNodeSize: 28,
  terrainNodeShape: "RECTANGLE",
  terrainNodeStrokeWidth: 5,
  terrainNodeFillOpacity: 100,
  terrainNodeStrokeOpacity: 100,
  confirmButtonColor: "#FFFFFF",
  cancelButtonColor: "#FFFFFF",
  terrainButtonColor: "#FFFFFF",
  confirmButtonIconColor: "#20242D",
  cancelButtonIconColor: "#20242D",
  terrainButtonIconColor: "#20242D",
  buttonSize: 50,
  buttonGap: 10,
  buttonIconScale: 70,
  buttonBorderColor: "#20242D",
  buttonBorderWidth: 5,
  indicatorBackgroundColor: "#ECEEF1",
  indicatorTextColor: "#20242D",
  indicatorBorderColor: "#20242D",
  indicatorBorderWidth: 5,
  indicatorWidth: 100,
  indicatorHeight: 50,
  indicatorFontSize: 30,
  indicatorOpacity: 100,
  circleAreaFillColor: "#000000",
  circleAreaFillOpacity: 28,
  circleAreaStrokeColor: "#FFFFFF",
  circleAreaStrokeOpacity: 100,
  circleAreaStrokeWidth: 2,
  coneAreaFillColor: "#000000",
  coneAreaFillOpacity: 28,
  coneAreaStrokeColor: "#FFFFFF",
  coneAreaStrokeOpacity: 100,
  coneAreaStrokeWidth: 2,
  areaIndicatorBackgroundColor: "#ECEEF1",
  areaIndicatorTextColor: "#20242D",
  areaIndicatorBorderColor: "#20242D",
  areaIndicatorBorderWidth: 5,
  areaIndicatorWidth: 100,
  areaIndicatorHeight: 50,
  areaIndicatorFontSize: 30,
  areaIndicatorOpacity: 100,
};

const LEGACY_DEFAULT_STYLE = {
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

const LEGACY_AREA_STYLE = {
  areaFillColor: "#D75B5B", areaFillOpacity: 28, areaStrokeColor: "#8E2C2C", areaStrokeOpacity: 75, areaStrokeWidth: 2,
};

const state = {
  active: false,
  finalizing: false,
  points: [],
  routeId: null,
  style: { ...DEFAULT_STYLE },
  styleTimestamp: 0,
  grid: { dpi: 70, scaleMultiplier: 5, unit: "ft", measurement: "ALTERNATING", type: "SQUARE" },
  routeInteraction: null,
  sharedCurveId: null,
  tokenId: null,
  tokenOriginalPosition: null,
  tokenStartPoint: null,
  tokenDimensions: null,
  terrainCells: [],
  localOverlayIds: [],
  localUiOverlayIds: [],
  localDistanceTextId: null,
  persistentRouteBadges: new Map(),
  persistentBadgeRefreshRunning: false,
  persistentBadgeRefreshQueued: false,
  localPreviewId: null,
  overlayErrorNoticeShown: false,
  controlHitTargets: [],
  currentPointer: null,
  dragStartPointer: null,
  dragStartTarget: null,
  dragging: false,
  dragStartedRoute: false,
  shiftWasDown: false,
  ctrlWasDown: false,
  lastPreviewUpdate: 0,
};

const shapeState = {
  mode: "circle",
  active: false,
  starting: false,
  startPromise: null,
  finalizing: false,
  origin: null,
  pointer: null,
  grid: null,
  basis: null,
  style: { ...DEFAULT_STYLE },
  previewIds: [],
  previewShapeId: null,
  previewStyleSignature: null,
  lastSnappedKey: null,
  lastGeometry: null,
  tooLarge: false,
  indicatorIds: [],
  indicatorAnchor: null,
  generation: 0,
  pendingPointer: null,
  previewWorkerRunning: false,
  drag: null,
  ignoreNextClick: false,
};

let waypointQueue = Promise.resolve();
let previewCurveQueue = Promise.resolve();

function makeId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `ruler-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function clamp(value, min, max, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

function validHex(value) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}

function migrateLegacyDefaults(metadata = {}) {
  const migrated = { ...(metadata || {}) };
  const legacyEntries = Object.entries(LEGACY_DEFAULT_STYLE);
  // Only migrate the old palette when every legacy field still matches the old
  // defaults. Migrating matching fields independently could overwrite a user's
  // intentional button color with the new default on a later read.
  const isEntireLegacyPalette = legacyEntries.every(([key, legacyValue]) => migrated[key] === legacyValue);
  if (isEntireLegacyPalette) {
    for (const [key] of legacyEntries) migrated[key] = DEFAULT_STYLE[key];
  }
  const legacyAreaKeys = Object.keys(LEGACY_AREA_STYLE);
  const hasLegacyAreaStyle = legacyAreaKeys.some((key) => Object.prototype.hasOwnProperty.call(migrated, key));
  if (hasLegacyAreaStyle) {
    const isOldRedPreset = legacyAreaKeys.every((key) => migrated[key] === LEGACY_AREA_STYLE[key]);
    const suffixes = ["FillColor", "FillOpacity", "StrokeColor", "StrokeOpacity", "StrokeWidth"];
    for (const suffix of suffixes) {
      const legacyKey = `area${suffix}`;
      const fallback = DEFAULT_STYLE[`circleArea${suffix}`];
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

function normalizeStyle(metadata = {}) {
  const merged = { ...DEFAULT_STYLE, ...(metadata || {}) };
  const shapeValues = ["CIRCLE", "RECTANGLE", "TRIANGLE", "HEXAGON"];
  const lineStyles = ["SOLID", "DASHED", "DOTTED"];
  const colorKeys = [
    "lineColor", "nodeColor", "nodeStrokeColor", "terrainNodeColor", "terrainNodeStrokeColor",
    "confirmButtonColor", "cancelButtonColor", "terrainButtonColor", "confirmButtonIconColor",
    "cancelButtonIconColor", "terrainButtonIconColor", "buttonBorderColor", "indicatorBackgroundColor",
    "indicatorTextColor", "indicatorBorderColor",
    "areaIndicatorBackgroundColor", "areaIndicatorTextColor", "areaIndicatorBorderColor",
    "circleAreaFillColor", "circleAreaStrokeColor", "coneAreaFillColor", "coneAreaStrokeColor",
  ];
  const numberRanges = {
    lineWidth: [1, 24], lineOpacity: [5, 100], nodeSize: [10, 64], nodeStrokeWidth: [0, 12],
    nodeFillOpacity: [0, 100], nodeStrokeOpacity: [0, 100], terrainNodeSize: [10, 68],
    terrainNodeStrokeWidth: [0, 12], terrainNodeFillOpacity: [0, 100], terrainNodeStrokeOpacity: [0, 100],
    buttonSize: [20, 60], buttonGap: [0, 24], buttonIconScale: [35, 95], buttonBorderWidth: [0, 8],
    indicatorBorderWidth: [0, 8], indicatorWidth: [70, 240], indicatorHeight: [18, 50],
    indicatorFontSize: [7, 30], indicatorOpacity: [10, 100],
    areaIndicatorBorderWidth: [0, 8], areaIndicatorWidth: [70, 240], areaIndicatorHeight: [18, 50],
    areaIndicatorFontSize: [7, 30], areaIndicatorOpacity: [10, 100],
    circleAreaFillOpacity: [0, 100], circleAreaStrokeOpacity: [0, 100], circleAreaStrokeWidth: [0, 12],
    coneAreaFillOpacity: [0, 100], coneAreaStrokeOpacity: [0, 100], coneAreaStrokeWidth: [0, 12],
  };
  const result = { ...merged };
  for (const key of colorKeys) result[key] = validHex(merged[key]) ? merged[key] : DEFAULT_STYLE[key];
  for (const [key, [min, max]] of Object.entries(numberRanges)) {
    result[key] = clamp(merged[key], min, max, DEFAULT_STYLE[key]);
  }
  result.lineStyle = lineStyles.includes(merged.lineStyle) ? merged.lineStyle : DEFAULT_STYLE.lineStyle;
  result.nodeShape = shapeValues.includes(merged.nodeShape) ? merged.nodeShape : DEFAULT_STYLE.nodeShape;
  result.terrainNodeShape = shapeValues.includes(merged.terrainNodeShape) ? merged.terrainNodeShape : DEFAULT_STYLE.terrainNodeShape;
  return result;
}

function localAppearanceStorageKey() {
  return `${LOCAL_APPEARANCE_STORAGE_PREFIX}${OBR.player?.id || "current-player"}`;
}

function readLocalAppearance() {
  try {
    const raw = localStorage.getItem(localAppearanceStorageKey());
    if (!raw) return null;
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object" || !value.style || typeof value.style !== "object") return null;
    return { style: normalizeStyle(migrateLegacyDefaults(value.style)), updatedAt: Number(value.updatedAt) || 0 };
  } catch {
    return null;
  }
}

function writeLocalAppearance(style, updatedAt) {
  try {
    localStorage.setItem(localAppearanceStorageKey(), JSON.stringify({ style: normalizeStyle(style), updatedAt }));
  } catch (error) {
    console.warn("Não foi possível manter uma cópia local da aparência da régua.", error);
  }
}

async function readStyle() {
  let playerMetadata = null;
  try {
    // The saved preference is player-specific, never shared tool metadata.
    playerMetadata = await OBR.player.getMetadata();
  } catch (error) {
    console.warn("Falha ao ler os metadados pessoais da régua.", error);
  }

  const rawRemoteStyle = playerMetadata?.[APPEARANCE_METADATA_KEY];
  const remoteStyle = rawRemoteStyle && typeof rawRemoteStyle === "object"
    ? normalizeStyle(migrateLegacyDefaults(rawRemoteStyle)) : null;
  const remoteUpdatedAt = Number(playerMetadata?.[APPEARANCE_UPDATED_AT_KEY]) || 0;
  const local = readLocalAppearance();

  // The local copy is written immediately when a field changes. If an Owlbear
  // metadata update is delayed (for example, when a popover closes quickly),
  // restore that newer copy instead of silently reverting the buttons.
  const useLocal = Boolean(local && (!remoteStyle || local.updatedAt > remoteUpdatedAt));
  if (useLocal) {
    state.styleTimestamp = local.updatedAt;
    try {
      await OBR.player.setMetadata({
        [APPEARANCE_METADATA_KEY]: local.style,
        [APPEARANCE_UPDATED_AT_KEY]: local.updatedAt,
      });
    } catch (error) {
      console.warn("A cópia local da aparência será mantida até os metadados sincronizarem.", error);
    }
    return { ...local.style };
  }

  if (remoteStyle) {
    state.styleTimestamp = remoteUpdatedAt;
    if (remoteUpdatedAt > 0) writeLocalAppearance(remoteStyle, remoteUpdatedAt);
    return { ...remoteStyle };
  }

  state.styleTimestamp = local?.updatedAt || 0;
  if (local) return { ...local.style };
  return { ...DEFAULT_STYLE };
}

async function readGrid() {
  try {
    const [dpi, scale, measurement, type] = await Promise.all([
      OBR.scene.grid.getDpi(),
      OBR.scene.grid.getScale(),
      OBR.scene.grid.getMeasurement(),
      OBR.scene.grid.getType(),
    ]);
    return {
      dpi: Number.isFinite(dpi) && dpi > 0 ? dpi : 70,
      scaleMultiplier: Number(scale?.parsed?.multiplier) > 0 ? Number(scale.parsed.multiplier) : 1,
      unit: typeof scale?.parsed?.unit === "string" ? scale.parsed.unit : "un.",
      digits: Number.isFinite(scale?.parsed?.digits) ? scale.parsed.digits : 0,
      measurement: measurement || "CHEBYSHEV",
      type: type || "SQUARE",
    };
  } catch (error) {
    console.warn("Não foi possível ler a grade da cena.", error);
    return { ...state.grid };
  }
}

async function snapToCell(point) {
  try {
    // Os nós usam centros de casas para manter a medição e o terreno difícil coerentes.
    return await OBR.scene.grid.snapPosition(point, 1, false, true);
  } catch {
    return { x: point.x, y: point.y };
  }
}

function getTargetKind(target) {
  if (!target) return null;
  const metadata = target.metadata || {};
  return metadata[KEY_KIND] || null;
}

function getControlAction(target) {
  if (!target) return null;
  const metadata = target.metadata || {};
  const action = metadata[KEY_ACTION];
  if (typeof action === "string") return action;
  if (typeof target.name === "string" && target.name.startsWith(`${EXTENSION_ID}:control:`)) {
    return target.name.split(":").at(-1);
  }
  return null;
}

function isTokenItem(item) {
  return Boolean(item && item.id && item.layer === "CHARACTER" && item.type === "IMAGE");
}

async function startRoute(point, target = null) {
  state.finalizing = false;
  state.active = true;
  state.points = [point];
  state.routeId = makeId();
  state.style = await readStyle();
  state.grid = await readGrid();
  state.currentPointer = point;
  state.sharedCurveId = null;
  state.routeInteraction = null;
  state.tokenId = null;
  state.tokenOriginalPosition = null;
  state.tokenStartPoint = null;
  state.tokenDimensions = null;
  state.terrainCells = [];

  if (isTokenItem(target)) {
    state.tokenId = target.id;
    state.tokenOriginalPosition = { ...target.position };
    state.tokenStartPoint = { ...point };
    const scaleY = Number(target.scale?.y) || 1;
    state.tokenDimensions = { width: Math.abs(Number(target.width) || state.grid.dpi) * (Number(target.scale?.x) || 1), height: Math.abs(Number(target.height) || state.grid.dpi) * scaleY };
  }
  await renderOverlay();
  await updatePreviewCurve(point);
}

function addWaypoint(rawPoint, target = null, options = {}) {
  if (state.finalizing || !rawPoint || !Number.isFinite(rawPoint.x) || !Number.isFinite(rawPoint.y)) return Promise.resolve();
  waypointQueue = waypointQueue
    .then(() => processWaypoint(rawPoint, target, options))
    .catch((error) => console.error("Não foi possível adicionar o ponto à régua.", error));
  return waypointQueue;
}

async function processWaypoint(rawPoint, target = null, options = {}) {
  // O primeiro clique precisa funcionar com state.active === false:
  // ele é justamente o clique que inicia uma rota nova.
  if (state.finalizing) return;
  const point = await snapToCell(rawPoint, false);
  if (state.finalizing) return;
  state.currentPointer = rawPoint;
  if (!state.active) {
    await startRoute(point, target);
    if (options.terrain) {
      const marked = await markTerrainCell(point);
      if (marked) {
        await renderOverlay();
        await updatePreviewCurve(rawPoint);
      }
    }
    return;
  }

  const last = state.points[state.points.length - 1];
  const minDistance = Math.max(1, state.grid.dpi * 0.08);
  if (last && Math.hypot(point.x - last.x, point.y - last.y) < minDistance) {
    // Shift can mark the current node even when the pointer has not moved far enough
    // to create another waypoint.
    if (options.terrain) {
      const marked = await markTerrainCell(last);
      if (marked) {
        await renderOverlay();
        await updatePreviewCurve(rawPoint);
      }
    }
    return;
  }

  state.points.push(point);
  if (options.terrain) await markTerrainCell(point);
  await syncSharedCurve();
  await moveAssociatedToken(point);
  await renderOverlay();
  await updatePreviewCurve(rawPoint);
}

async function syncSharedCurve() {
  if (state.points.length < 2) return;
  if (!state.routeInteraction) {
    const curve = createCurve(state.points, true);
    state.sharedCurveId = curve.id;
    state.routeInteraction = await OBR.interaction.startItemInteraction(curve);
    return;
  }
  const [update] = state.routeInteraction;
  update((draft) => {
    draft.points = state.points.map((point) => ({ ...point }));
  });
}

function createCurve(points, inProgress = false, itemId = makeId(), distanceText = null, anchorHalfHeight = null, options = {}) {
  const dataOnly = Boolean(options.dataOnly);
  const routeId = options.routeId ?? state.routeId;
  let builder = buildCurve()
    .id(itemId)
    .name(inProgress ? "Régua em andamento" : dataOnly ? "Dados da régua (visualização por jogador)" : "Régua de percurso")
    .points(points.map((point) => ({ x: point.x, y: point.y })))
    .tension(0)
    .strokeColor(state.style.lineColor)
    .strokeOpacity(dataOnly ? 0 : (inProgress ? 0.82 * state.style.lineOpacity / 100 : state.style.lineOpacity / 100))
    .strokeWidth(state.style.lineWidth)
    .fillOpacity(0)
    .layer("DRAWING")
    .zIndex(1000)
    .disableAutoZIndex(true)
    .disableHit(dataOnly)
    .metadata({
      [KEY_KIND]: inProgress ? "route-preview" : "route",
      [KEY_ROUTE]: routeId,
      [KEY_CREATED]: "Régua de Percurso 0.3.16",
      ...(dataOnly ? { [`${EXTENSION_ID}/localVisuals`]: true } : {}),
      ...(typeof distanceText === "string" ? { [KEY_DISTANCE_TEXT]: distanceText } : {}),
      ...(Number.isFinite(anchorHalfHeight) ? { [KEY_ANCHOR_HALF_HEIGHT]: anchorHalfHeight } : {}),
    });
  const dash = getLineDash();
  if (dash.length) builder = builder.strokeDash(dash);
  return builder.build();
}

function createLocalRouteCurve(points, routeId) {
  let builder = buildCurve()
    .id(makeId())
    .name("Régua de percurso (aparência local)")
    .points(points.map((point) => ({ x: point.x, y: point.y })))
    .tension(0)
    .strokeColor(state.style.lineColor)
    .strokeOpacity(state.style.lineOpacity / 100)
    .strokeWidth(state.style.lineWidth)
    .fillOpacity(0)
    .layer("DRAWING")
    .zIndex(1000)
    .disableAutoZIndex(true)
    .disableHit(true)
    .metadata({ [KEY_KIND]: "route-visual-local", [KEY_ROUTE]: routeId });
  const dash = getLineDash();
  if (dash.length) builder = builder.strokeDash(dash);
  return builder.build();
}

async function moveAssociatedToken(point) {
  if (!state.tokenId || !state.tokenOriginalPosition || !state.tokenStartPoint) return;
  const offsetX = point.x - state.tokenStartPoint.x;
  const offsetY = point.y - state.tokenStartPoint.y;
  await OBR.scene.items.updateItems([state.tokenId], (items) => {
    if (!items.length) return;
    items[0].position = {
      x: state.tokenOriginalPosition.x + offsetX,
      y: state.tokenOriginalPosition.y + offsetY,
    };
  });
}

async function restoreAssociatedToken() {
  if (!state.tokenId || !state.tokenOriginalPosition) return;
  try {
    await OBR.scene.items.updateItems([state.tokenId], (items) => {
      if (!items.length) return;
      items[0].position = { ...state.tokenOriginalPosition };
    });
  } catch (error) {
    console.warn("Não foi possível restaurar a posição original do token.", error);
  }
}

function sameCell(a, b, tolerance) {
  return Math.abs(a.x - b.x) <= tolerance && Math.abs(a.y - b.y) <= tolerance;
}

function getTerrainCells() {
  // Terreno difícil existe apenas em memória durante a régua atual. Nada é gravado na cena.
  return state.terrainCells.map((cell) => ({ ...cell }));
}

async function migrateTerrainMarkers() {
  // Limpa marcadores invisíveis deixados por versões anteriores que salvavam o terreno no mapa.
  try {
    const oldMarkers = await OBR.scene.items.getItems((item) => getTargetKind(item) === "terrain");
    if (oldMarkers.length) await OBR.scene.items.deleteItems(oldMarkers.map((item) => item.id));
  } catch (error) {
    console.warn("Não foi possível remover marcadores antigos de terreno difícil.", error);
  }
}

function traceCells(from, to, dpi) {
  const x1 = Math.round((to.x - from.x) / dpi);
  const y1 = Math.round((to.y - from.y) / dpi);
  let x = 0;
  let y = 0;
  const dx = Math.abs(x1);
  const sx = x1 >= 0 ? 1 : -1;
  const dy = Math.abs(y1);
  const sy = y1 >= 0 ? 1 : -1;
  let error = dx - dy;
  const cells = [{ x: from.x, y: from.y }];
  let guard = 0;

  while ((x !== x1 || y !== y1) && guard++ < 10000) {
    const twice = 2 * error;
    const oldX = x;
    const oldY = y;
    if (twice > -dy) {
      error -= dy;
      x += sx;
    }
    if (twice < dx) {
      error += dx;
      y += sy;
    }
    cells.push({ x: from.x + x * dpi, y: from.y + y * dpi, stepX: Math.abs(x - oldX), stepY: Math.abs(y - oldY) });
  }
  return cells;
}

function isTerrainCell(cell, terrain, dpi) {
  const tolerance = Math.max(2, dpi * 0.2);
  return terrain.some((marker) => sameCell(cell, marker, tolerance));
}

function formatDistance(cellUnits, grid = state.grid) {
  const scaled = cellUnits * (grid.scaleMultiplier || 1);
  const digits = grid.digits ?? 0;
  let value = scaled.toFixed(Math.min(2, Math.max(0, digits)));
  if (digits === 0) value = String(Math.round(scaled * 100) / 100).replace(/\.0+$/, "");
  else value = value.replace(/0+$/, "").replace(/\.$/, "");
  return `${value} ${grid.unit}`;
}


async function calculateDistance(points = state.points) {
  if (points.length < 2) return 0;
  const terrain = getTerrainCells();
  const dpi = state.grid.dpi || 70;
  const measurement = state.grid.measurement;
  const squareGrid = state.grid.type === "SQUARE";
  let total = 0;
  let diagonalCount = 0;
  let lastCell = null;

  for (let segment = 0; segment < points.length - 1; segment++) {
    const from = points[segment];
    const to = points[segment + 1];
    const cells = squareGrid ? traceCells(from, to, dpi) : [];

    if (squareGrid && measurement !== "EUCLIDEAN") {
      for (let index = 1; index < cells.length; index++) {
        const previous = cells[index - 1];
        const cell = cells[index];
        const diagonal = Boolean(cell.stepX && cell.stepY);
        let stepCost;
        if (measurement === "MANHATTAN") {
          stepCost = (cell.stepX || 0) + (cell.stepY || 0);
        } else if (measurement === "ALTERNATING" && diagonal) {
          stepCost = diagonalCount % 2 === 0 ? 1 : 2;
          diagonalCount += 1;
        } else {
          stepCost = 1;
          if (measurement === "ALTERNATING" && diagonal) diagonalCount += 1;
        }

        const key = `${Math.round(cell.x / dpi)}:${Math.round(cell.y / dpi)}`;
        if (lastCell !== key) {
          total += stepCost;
          if (isTerrainCell(cell, terrain, dpi)) total += stepCost;
        }
        lastCell = key;
      }
    } else {
      let distance = 0;
      try {
        distance = await OBR.scene.grid.getDistance(from, to);
      } catch {
        distance = Math.hypot(to.x - from.x, to.y - from.y) / dpi;
      }
      total += Number.isFinite(distance) ? distance : 0;

      if (squareGrid && measurement === "EUCLIDEAN") {
        for (let index = 1; index < cells.length; index++) {
          const cell = cells[index];
          const key = `${Math.round(cell.x / dpi)}:${Math.round(cell.y / dpi)}`;
          if (lastCell !== key && isTerrainCell(cell, terrain, dpi)) {
            const stepCost = cell.stepX && cell.stepY ? Math.SQRT2 : 1;
            total += stepCost;
          }
          lastCell = key;
        }
      }
    }
  }
  return total;
}


function getLineDash() {
  if (state.style.lineStyle === "SOLID") return [];
  if (state.style.lineStyle === "DOTTED") return [Math.max(1.5, state.style.lineWidth * 0.25), Math.max(4, state.style.lineWidth * 1.2)];
  return [Math.max(8, state.style.lineWidth * 2.2), Math.max(5, state.style.lineWidth * 1.35)];
}


function createMapShape(centerPosition, width, height, options = {}) {
  const shapeType = options.shapeType || "RECTANGLE";
  // In Owlbear, circle shapes are positioned by their center; rectangular
  // shapes use their top-left origin. Convert the requested center for rectangles.
  const position = shapeType === "RECTANGLE"
    ? { x: centerPosition.x - width / 2, y: centerPosition.y - height / 2 }
    : { x: centerPosition.x, y: centerPosition.y };
  let builder = buildShape()
    .id(makeId())
    .name(options.name || "Desenho da interface da régua")
    .shapeType(shapeType)
    .width(width)
    .height(height)
    .position(position)
    .fillColor(options.fillColor || "#20242d")
    .fillOpacity(options.fillOpacity ?? 1)
    .strokeColor(options.strokeColor || options.fillColor || "#20242d")
    .strokeOpacity(options.strokeOpacity ?? 0)
    .strokeWidth(options.strokeWidth ?? 0)
    .layer(options.layer || "DRAWING")
    .zIndex(options.zIndex ?? 1500)
    .disableAutoZIndex(true)
    .disableHit(true)
    .metadata(options.metadata || {});
  if (options.rotation !== undefined) builder = builder.rotation(options.rotation);
  if (options.parentId) builder = builder.attachedTo(options.parentId);
  return builder.build();
}

function createMapText(text, centerPosition, width, height, options = {}) {
  // Text items use a top-left origin. Keep the desired center aligned with the
  // pill/button while leaving all dimensions in map units (no zoom compensation).
  let builder = buildText()
    .id(makeId())
    .name(options.name || `Texto desenhado: ${text}`)
    .plainText(String(text))
    .textType("PLAIN")
    .width(width)
    .height(height)
    .position({ x: centerPosition.x - width / 2, y: centerPosition.y - height / 2 })
    .padding(0)
    .fontFamily("Arial, 'Segoe UI Symbol', sans-serif")
    .fontSize(options.fontSize ?? height * 0.56)
    .fontWeight(options.fontWeight ?? 800)
    .textAlign("CENTER")
    .textAlignVertical("MIDDLE")
    .fillColor(options.textColor || "#ffffff")
    .fillOpacity(1)
    .strokeOpacity(0)
    .strokeWidth(0)
    .layer(options.layer || "RULER")
    .zIndex(options.zIndex ?? 1501)
    .disableAutoZIndex(true)
    .disableHit(true)
    .metadata(options.metadata || {});
  if (options.parentId) builder = builder.attachedTo(options.parentId);
  return builder.build();
}

const CONTROL_INDICATOR_GAP_MAP = 6;
const INDICATOR_NODE_GAP_MAP = 8;

function getMapUiLayout(latest, indicatorHeight = state.style.indicatorHeight) {
  const latestIsTerrain = state.grid.type === "SQUARE" && isTerrainCell(latest, getTerrainCells(), state.grid.dpi);
  const latestNodeSize = latestIsTerrain ? state.style.terrainNodeSize : state.style.nodeSize;
  const buttonSize = state.style.buttonSize;
  const buttonGap = state.style.buttonGap;
  const distanceCenter = {
    x: latest.x,
    y: latest.y - latestNodeSize / 2 - INDICATOR_NODE_GAP_MAP - indicatorHeight / 2,
  };
  const buttonsCenterY = distanceCenter.y - indicatorHeight / 2 - CONTROL_INDICATOR_GAP_MAP - buttonSize / 2;
  const rowWidth = buttonSize * 3 + buttonGap * 2;
  const firstCenterX = latest.x - rowWidth / 2 + buttonSize / 2;
  const buttons = [0, 1, 2].map((index) => ({
    x: firstCenterX + index * (buttonSize + buttonGap),
    y: buttonsCenterY,
    size: buttonSize,
  }));
  return { anchorX: latest.x, distanceCenter, buttons, anchorHalfHeight: latestNodeSize / 2 };
}

function createDistancePillItems(text, centerPosition, metadata = {}, options = {}) {
  const visualStyle = options.style || state.style;
  const width = options.width || visualStyle.indicatorWidth;
  const height = options.height || visualStyle.indicatorHeight;
  const centerRectWidth = Math.max(1, width - height);
  const leftCenter = { x: centerPosition.x - centerRectWidth / 2, y: centerPosition.y };
  const rightCenter = { x: centerPosition.x + centerRectWidth / 2, y: centerPosition.y };
  const shared = { [KEY_KIND]: "route-distance", ...metadata };
  const borderWidth = visualStyle.indicatorBorderWidth;
  const layer = options.backgroundLayer || "CONTROL";
  const items = [];

  // Draw the outline as a solid capsule beneath the fill. Giving each of the
  // three pieces its own stroke draws two unwanted circular outlines at the
  // joins, so the border is built from filled shapes without individual strokes.
  if (borderWidth > 0) {
    const outerHeight = height + borderWidth * 2;
    const borderBase = {
      fillColor: visualStyle.indicatorBorderColor,
      fillOpacity: 1,
      strokeOpacity: 0,
      strokeWidth: 0,
      metadata: shared,
      parentId: options.parentId,
      layer,
    };
    items.push(
      createMapShape(centerPosition, centerRectWidth, outerHeight, {
        ...borderBase,
        name: "Contorno central do indicador de distância",
        shapeType: "RECTANGLE",
        zIndex: 1890,
      }),
      createMapShape(leftCenter, outerHeight, outerHeight, {
        ...borderBase,
        name: "Extremidade esquerda do contorno do indicador",
        shapeType: "CIRCLE",
        zIndex: 1891,
      }),
      createMapShape(rightCenter, outerHeight, outerHeight, {
        ...borderBase,
        name: "Extremidade direita do contorno do indicador",
        shapeType: "CIRCLE",
        zIndex: 1892,
      }),
    );
  }

  const fillOptions = {
    fillColor: visualStyle.indicatorBackgroundColor,
    fillOpacity: visualStyle.indicatorOpacity / 100,
    strokeOpacity: 0,
    strokeWidth: 0,
    metadata: shared,
    parentId: options.parentId,
    layer,
  };
  items.push(
    createMapShape(centerPosition, centerRectWidth, height, {
      ...fillOptions,
      name: "Fundo central do indicador de distância",
      shapeType: "RECTANGLE",
      zIndex: 1900,
    }),
    createMapShape(leftCenter, height, height, {
      ...fillOptions,
      name: "Extremidade esquerda do indicador de distância",
      shapeType: "CIRCLE",
      zIndex: 1901,
    }),
    createMapShape(rightCenter, height, height, {
      ...fillOptions,
      name: "Extremidade direita do indicador de distância",
      shapeType: "CIRCLE",
      zIndex: 1902,
    }),
    createMapText(text, centerPosition, width - 8, height - 2, {
      name: options.name || "Número desenhado da distância",
      fontSize: visualStyle.indicatorFontSize,
      fontWeight: 800,
      textColor: visualStyle.indicatorTextColor,
      zIndex: 2200,
      metadata: shared,
      parentId: options.parentId,
      layer: options.textLayer || "CONTROL",
    }),
  );
  return items;
}

function createTerrainCopyIconItems(centerPosition, size, metadata) {
  // Draw a compact copy-style icon as six filled bars. The front square is
  // complete; the rear square contributes only its top and right edges.
  const iconScale = state.style.buttonIconScale / 72;
  const side = size * 0.32 * iconScale;
  const offset = side * 0.32;
  const thickness = Math.max(0.9, size * 0.035 * iconScale);
  const front = { x: centerPosition.x - offset / 2, y: centerPosition.y + offset / 2 };
  const left = front.x - side / 2;
  const right = front.x + side / 2;
  const top = front.y - side / 2;
  const bottom = front.y + side / 2;
  const backLeft = left + offset;
  const backRight = right + offset;
  const backTop = top - offset;
  const backBottom = bottom - offset;
  const color = state.style.terrainButtonIconColor;
  const bars = [
    ["front-top", { x: front.x, y: top }, side + thickness, thickness],
    ["front-bottom", { x: front.x, y: bottom }, side + thickness, thickness],
    ["front-left", { x: left, y: front.y }, thickness, side + thickness],
    ["front-right", { x: right, y: front.y }, thickness, side + thickness],
    ["back-top", { x: (backLeft + backRight) / 2, y: backTop }, side + thickness, thickness],
    ["back-right", { x: backRight, y: (backTop + backBottom) / 2 }, thickness, side + thickness],
  ];
  return bars.map(([part, position, width, height]) => createMapShape(position, width, height, {
    name: `${EXTENSION_ID}:icon:terrain:${part}`,
    shapeType: "RECTANGLE", fillColor: color, fillOpacity: 1,
    strokeOpacity: 0, strokeWidth: 0, zIndex: 2200, metadata, layer: "CONTROL",
  }));
}

function createControlItems(action, text, centerPosition, size = state.style.buttonSize) {
  const colorKey = action === "confirm" ? "confirmButtonColor" : action === "cancel" ? "cancelButtonColor" : "terrainButtonColor";
  const iconColorKey = action === "confirm" ? "confirmButtonIconColor" : action === "cancel" ? "cancelButtonIconColor" : "terrainButtonIconColor";
  const metadata = { [KEY_KIND]: "control", [KEY_ACTION]: action };
  const background = createMapShape(centerPosition, size, size, {
    name: `${EXTENSION_ID}:control:${action}`,
    shapeType: "CIRCLE",
    fillColor: state.style[colorKey],
    fillOpacity: 1,
    strokeColor: state.style.buttonBorderColor,
    strokeOpacity: state.style.buttonBorderWidth > 0 ? 1 : 0,
    strokeWidth: state.style.buttonBorderWidth,
    zIndex: 2100,
    metadata,
    layer: "CONTROL",
  });
  if (action === "terrain") {
    return [background, ...createTerrainCopyIconItems(centerPosition, size, metadata)];
  }

  const glyph = action === "confirm" ? "✓" : "✕";
  const iconScale = state.style.buttonIconScale / 100;
  const icon = createMapText(glyph, centerPosition, size * 0.82, size * 0.82, {
    name: `${EXTENSION_ID}:icon:${action}`,
    // Keep the glyph inset enough to remain centered and fully inside its circle.
    fontSize: size * Math.min(0.62, iconScale * 0.86),
    fontWeight: 900,
    textColor: state.style[iconColorKey],
    zIndex: 2200,
    metadata,
    layer: "CONTROL",
  });
  return [background, icon];
}

function createNode(point, routeId, persistent, terrain = false, parentId = null, dataOnly = false) {
  const size = terrain ? state.style.terrainNodeSize : state.style.nodeSize;
  const shape = terrain ? state.style.terrainNodeShape : state.style.nodeShape;
  const fill = terrain ? state.style.terrainNodeColor : state.style.nodeColor;
  const stroke = terrain ? state.style.terrainNodeStrokeColor : state.style.nodeStrokeColor;
  const strokeWidth = terrain ? state.style.terrainNodeStrokeWidth : state.style.nodeStrokeWidth;
  const fillOpacity = (terrain ? state.style.terrainNodeFillOpacity : state.style.nodeFillOpacity) / 100;
  const strokeOpacity = (terrain ? state.style.terrainNodeStrokeOpacity : state.style.nodeStrokeOpacity) / 100;
  let builder = buildShape()
    .id(makeId())
    .name(terrain ? "Nó em terreno difícil" : persistent ? "Nó da régua" : "Prévia de nó da régua")
    .shapeType(shape)
    .width(size)
    .height(size)
    .position(shape === "RECTANGLE" ? { x: point.x - size / 2, y: point.y - size / 2 } : { x: point.x, y: point.y })
    .fillColor(fill)
    .fillOpacity(dataOnly ? 0 : fillOpacity)
    .strokeColor(stroke)
    .strokeOpacity(dataOnly ? 0 : strokeOpacity)
    .strokeWidth(strokeWidth)
    .zIndex(1200)
    .disableAutoZIndex(true)
    .disableHit(dataOnly)
    .layer("DRAWING")
    .metadata({
      [KEY_KIND]: persistent ? (terrain ? "route-node-terrain" : "route-node") : (terrain ? "local-node-terrain" : "local-node"),
      [KEY_ROUTE]: routeId,
      [KEY_NODE_CENTER_X]: point.x,
      [KEY_NODE_CENTER_Y]: point.y,
      [KEY_CREATED]: "Régua de Percurso 0.3.16",
    });
  builder = parentId ? builder.attachedTo(parentId) : builder;
  return builder.build();
}


async function updateDistancePreview(pointer) {
  const textId = state.localDistanceTextId;
  if (!state.active || state.finalizing || !textId || !pointer || !Number.isFinite(pointer.x) || !Number.isFinite(pointer.y)) return;

  try {
    const endpoint = await snapToCell(pointer);
    const measurePoints = [...state.points, endpoint];
    const total = await calculateDistance(measurePoints);
    const text = formatDistance(total);
    await OBR.scene.local.updateItems([textId], (items) => {
      for (const item of items) {
        if (item.type === "TEXT") item.text.plainText = text;
      }
    });
  } catch (error) {
    console.warn("Régua 0.3.16: não foi possível atualizar o indicador de distância.", error);
  }
}

async function migrateLegacyDistanceLabels() {
  // Migrate old shared distance labels/texts and remove their former badge parts;
  // the new renderer creates one player-local badge with the player's appearance.
  try {
    const [sceneItems, localItems] = await Promise.all([
      OBR.scene.items.getItems(),
      OBR.scene.local.getItems(),
    ]);
    const legacyShared = sceneItems.filter((item) =>
      ["LABEL", "TEXT", "SHAPE"].includes(item.type) && getTargetKind(item) === "route-distance"
    );

    for (const badge of legacyShared) {
      const route = sceneItems.find((item) => item.id === badge.attachedTo && item.type === "CURVE") ||
        sceneItems.find((item) => item.type === "CURVE" && getTargetKind(item) === "route" && item.metadata?.[KEY_ROUTE] === badge.metadata?.[KEY_ROUTE]);
      const text = badge.text?.plainText ?? badge.text?.text;
      if (route && typeof text === "string" && text.trim()) {
        const routeNodes = sceneItems.filter((item) =>
          item.attachedTo === route.id && ["route-node", "route-node-terrain"].includes(getTargetKind(item))
        );
        const endpoint = route.points?.[route.points.length - 1];
        let halfHeight = state.style.nodeSize / 2;
        if (endpoint && routeNodes.length) {
          const lastNode = routeNodes.reduce((closest, node) => {
            const x = Number.isFinite(node.metadata?.[KEY_NODE_CENTER_X]) ? node.metadata[KEY_NODE_CENTER_X] : node.position?.x;
            const y = Number.isFinite(node.metadata?.[KEY_NODE_CENTER_Y]) ? node.metadata[KEY_NODE_CENTER_Y] : node.position?.y;
            const d = Math.hypot(x - endpoint.x, y - endpoint.y);
            if (!closest || d < closest.distance) return { node, distance: d };
            return closest;
          }, null)?.node;
          if (lastNode) halfHeight = isTerrainRouteNode(lastNode) ? state.style.terrainNodeSize / 2 : state.style.nodeSize / 2;
        }
        try {
          await OBR.scene.items.updateItems([route.id], (routes) => {
            for (const current of routes) {
              current.metadata = current.metadata || {};
              if (typeof current.metadata[KEY_DISTANCE_TEXT] !== "string") {
                current.metadata[KEY_DISTANCE_TEXT] = text.trim();
                current.metadata[KEY_ANCHOR_HALF_HEIGHT] = halfHeight;
              }
            }
          });
        } catch (error) {
          console.warn("Régua 0.3.16: não foi possível migrar a distância de uma rota antiga.", error);
        }
      }
    }

    const sharedDeleteIds = legacyShared.map((item) => item.id);
    if (sharedDeleteIds.length) await OBR.scene.items.deleteItems(sharedDeleteIds);

    const localLegacyIds = localItems
      .filter((item) => ["LABEL", "TEXT"].includes(item.type) && ["route-distance", "route-distance-local", "distance-preview", "control"].includes(getTargetKind(item)))
      .map((item) => item.id);
    if (localLegacyIds.length) await OBR.scene.local.deleteItems(localLegacyIds);
  } catch (error) {
    console.warn("Régua 0.3.16: não foi possível limpar todos os indicadores antigos.", error);
  }
}

async function showOverlayErrors(errors) {
  if (!errors.length || state.overlayErrorNoticeShown) return;
  state.overlayErrorNoticeShown = true;
  const first = errors[0];
  const detail = String(first.error?.message || first.error || "erro desconhecido").slice(0, 120);
  try {
    await OBR.notification.show(`Régua 0.3.16: falha em ${first.description}. ${detail}`, "ERROR");
  } catch (notificationError) {
    console.error("Régua 0.3.16: falha ao mostrar o aviso de erro.", notificationError);
  }
}

async function addLocalOverlayItem(description, makeItem, destinationIds, errors) {
  try {
    const item = makeItem();
    await OBR.scene.local.addItems([item]);
    destinationIds.push(item.id);
    return true;
  } catch (error) {
    errors.push({ description, error });
    console.error(`Régua 0.3.16: falha ao desenhar ${description}.`, error);
    return false;
  }
}

async function renderMapUiOverlay(preserveOldUntilReady = false) {
  const oldIds = preserveOldUntilReady ? [...state.localUiOverlayIds] : [];
  const oldTargets = preserveOldUntilReady ? [...state.controlHitTargets] : [];
  const oldDistanceTextId = preserveOldUntilReady ? state.localDistanceTextId : null;
  if (preserveOldUntilReady) {
    state.localUiOverlayIds = [];
    state.localDistanceTextId = null;
  } else {
    await clearMapUiOverlay();
  }
  if (!state.active || state.points.length === 0) {
    if (oldIds.length) await OBR.scene.local.deleteItems(oldIds).catch(() => {});
    state.controlHitTargets = [];
    return true;
  }
  const errors = [];
  let total = 0;
  try {
    total = await calculateDistance();
  } catch (error) {
    errors.push({ description: "a distância", error });
    console.error("Régua 0.3.16: falha ao calcular a distância.", error);
  }

  const latest = state.points[state.points.length - 1];
  const layout = getMapUiLayout(latest);
  const distanceItems = createDistancePillItems(formatDistance(total), layout.distanceCenter, {
    [KEY_KIND]: "distance-preview",
    [KEY_ROUTE]: state.routeId,
  });
  for (const item of distanceItems) {
    const added = await addLocalOverlayItem(
      item.type === "TEXT" ? "o número do indicador de distância" : "o fundo do indicador de distância",
      () => item,
      state.localUiOverlayIds,
      errors,
    );
    if (added && item.type === "TEXT") state.localDistanceTextId = item.id;
  }

  const nextControlTargets = [];
  const controls = [
    ["confirm", "✓"],
    ["cancel", "✕"],
    ["terrain", "TD"],
  ];
  for (const [index, control] of controls.entries()) {
    const [action, text] = control;
    const position = { x: layout.buttons[index].x, y: layout.buttons[index].y };
    const controlItems = createControlItems(action, text, position, layout.buttons[index].size);
    let backgroundAdded = false;
    for (const [partIndex, item] of controlItems.entries()) {
      const added = await addLocalOverlayItem(
        `o desenho do botão ${action} (${partIndex === 0 ? "fundo" : "ícone"})`,
        () => item,
        state.localUiOverlayIds,
        errors,
      );
      if (partIndex === 0) backgroundAdded = added;
    }
    if (backgroundAdded) nextControlTargets.push({ action, position, size: layout.buttons[index].size });
  }

  if (preserveOldUntilReady && errors.length) {
    const newIds = [...state.localUiOverlayIds];
    state.localUiOverlayIds = oldIds;
    state.localDistanceTextId = oldDistanceTextId;
    state.controlHitTargets = oldTargets;
    if (newIds.length) await OBR.scene.local.deleteItems(newIds).catch(() => {});
    await showOverlayErrors(errors);
    return false;
  }

  state.controlHitTargets = nextControlTargets;
  if (oldIds.length) await OBR.scene.local.deleteItems(oldIds).catch(() => {});
  await showOverlayErrors(errors);
  if (!errors.length && state.currentPointer) await updateDistancePreview(state.currentPointer);
  return errors.length === 0;
}

async function renderOverlay() {
  await clearOverlay();
  if (!state.active || state.points.length === 0) return;
  const errors = [];
  const terrain = getTerrainCells();
  for (const point of state.points) {
    const isDifficult = state.grid.type === "SQUARE" && isTerrainCell(point, terrain, state.grid.dpi);
    await addLocalOverlayItem(
      "um nó",
      () => createNode(point, state.routeId, false, isDifficult),
      state.localOverlayIds,
      errors,
    );
  }
  await renderMapUiOverlay();
  await showOverlayErrors(errors);
}

function isTerrainRouteNode(item) {
  const kind = getTargetKind(item);
  return kind === "route-node-terrain" || (typeof item?.name === "string" && item.name.toLowerCase().includes("terreno difícil"));
}

async function refreshPersistentRouteBadges(sceneItems = null) {
  if (state.persistentBadgeRefreshRunning) {
    state.persistentBadgeRefreshQueued = true;
    return;
  }
  state.persistentBadgeRefreshRunning = true;
  try {
    const items = sceneItems || await OBR.scene.items.getItems();
    const routes = items.filter((item) =>
      item.type === "CURVE" &&
      item.metadata?.[KEY_KIND] === "route" &&
      Array.isArray(item.points) && item.points.length > 0
    );
    const liveIds = new Set(routes.map((route) => route.id));

    for (const [routeId, entry] of [...state.persistentRouteBadges.entries()]) {
      if (liveIds.has(routeId)) continue;
      if (entry.ids.length) await OBR.scene.local.deleteItems(entry.ids).catch(() => {});
      state.persistentRouteBadges.delete(routeId);
    }

    for (const route of routes) {
      const routeNodes = items.filter((item) =>
        item.type === "SHAPE" &&
        item.attachedTo === route.id &&
        ["route-node", "route-node-terrain"].includes(getTargetKind(item))
      );
      const terrainFlags = route.points.map((point) => {
        const nearest = routeNodes.reduce((best, node) => {
          const nodeX = Number.isFinite(node.metadata?.[KEY_NODE_CENTER_X]) ? node.metadata[KEY_NODE_CENTER_X] : (node.position?.x ?? Infinity);
          const nodeY = Number.isFinite(node.metadata?.[KEY_NODE_CENTER_Y]) ? node.metadata[KEY_NODE_CENTER_Y] : (node.position?.y ?? Infinity);
          const distance = Math.hypot(nodeX - point.x, nodeY - point.y);
          return !best || distance < best.distance ? { node, distance } : best;
        }, null);
        return Boolean(nearest && nearest.distance <= Math.max(3, state.grid.dpi * 0.35) && isTerrainRouteNode(nearest.node));
      });
      const latest = route.points[route.points.length - 1];
      const isLatestTerrain = terrainFlags[terrainFlags.length - 1] || false;
      const halfHeight = (isLatestTerrain ? state.style.terrainNodeSize : state.style.nodeSize) / 2;
      const center = {
        x: latest.x,
        y: latest.y - halfHeight - INDICATOR_NODE_GAP_MAP - state.style.indicatorHeight / 2,
      };
      const text = typeof route.metadata[KEY_DISTANCE_TEXT] === "string" ? route.metadata[KEY_DISTANCE_TEXT] : "—";
      const signature = JSON.stringify({
        points: route.points,
        text,
        terrainFlags,
        style: state.style,
      });
      const existing = state.persistentRouteBadges.get(route.id);
      if (existing?.signature === signature) continue;
      if (existing?.ids?.length) await OBR.scene.local.deleteItems(existing.ids).catch(() => {});

      const displayItems = [createLocalRouteCurve(route.points, route.metadata[KEY_ROUTE] || route.id)];
      route.points.forEach((point, index) => {
        displayItems.push(createNode(point, route.metadata[KEY_ROUTE] || route.id, false, terrainFlags[index], null, false));
      });
      displayItems.push(...createDistancePillItems(text, center, {
        [KEY_ROUTE]: route.metadata[KEY_ROUTE] || route.id,
        [KEY_KIND]: "route-distance-local",
      }, { name: "Distância local da régua confirmada" }));

      const ids = [];
      let allAdded = true;
      for (const item of displayItems) {
        try {
          await OBR.scene.local.addItems([item]);
          ids.push(item.id);
        } catch (error) {
          allAdded = false;
          console.error("Régua 0.3.16: falha ao desenhar uma rota com a aparência local.", error);
        }
      }
      state.persistentRouteBadges.set(route.id, { ids, signature: allAdded ? signature : null });
    }
  } catch (error) {
    console.warn("Régua 0.3.16: não foi possível atualizar as rotas com a aparência local.", error);
  } finally {
    state.persistentBadgeRefreshRunning = false;
    if (state.persistentBadgeRefreshQueued) {
      state.persistentBadgeRefreshQueued = false;
      void refreshPersistentRouteBadges();
    }
  }
}

async function clearStaleLocalRouteVisuals() {
  // Local scene items may survive a page reload. Remove only this extension's
  // generated drawings; persistent route data stays in the shared scene.
  try {
    const localItems = await OBR.scene.local.getItems();
    const disposableKinds = new Set([
      "route-visual-local", "local-node", "local-node-terrain", "route-distance-local",
      "route-distance", "distance-preview", "control", "preview", "area-preview",
    ]);
    const ids = localItems
      .filter((item) => disposableKinds.has(getTargetKind(item)))
      .map((item) => item.id);
    if (ids.length) await OBR.scene.local.deleteItems(ids);
  } catch (error) {
    console.warn("Régua 0.3.16: não foi possível limpar desenhos locais antigos.", error);
  }
}

async function migrateRoutesToLocalRendering() {
  // Route items are shared as geometry/data but rendered locally for each player's own style.
  try {
    const items = await OBR.scene.items.getItems();
    const routes = items.filter((item) => item.type === "CURVE" && getTargetKind(item) === "route");
    for (const route of routes) {
      const needsMigration = !route.metadata?.[`${EXTENSION_ID}/localVisuals`] || Number(route.strokeOpacity) !== 0;
      const childNodes = items.filter((item) =>
        item.type === "SHAPE" && item.attachedTo === route.id &&
        ["route-node", "route-node-terrain"].includes(getTargetKind(item))
      );
      const visibleNodes = childNodes.filter((node) => Number(node.fillOpacity) !== 0 || Number(node.strokeOpacity) !== 0);
      if (!needsMigration && visibleNodes.length === 0) continue;
      const ids = [route.id, ...visibleNodes.map((node) => node.id)];
      await OBR.scene.items.updateItems(ids, (drafts) => {
        for (const item of drafts) {
          item.metadata = item.metadata || {};
          if (item.id === route.id) {
            item.strokeOpacity = 0;
            item.metadata[`${EXTENSION_ID}/localVisuals`] = true;
          } else {
            item.fillOpacity = 0;
            item.strokeOpacity = 0;
          }
        }
      });
    }
  } catch (error) {
    console.warn("Régua 0.3.16: não foi possível migrar rotas antigas para exibição local.", error);
  }
}

async function clearMapUiOverlay() {
  state.controlHitTargets = [];
  state.localDistanceTextId = null;
  if (state.localUiOverlayIds.length) {
    const ids = [...state.localUiOverlayIds];
    state.localUiOverlayIds = [];
    await OBR.scene.local.deleteItems(ids).catch(() => {});
  }
}

async function clearOverlay() {
  state.controlHitTargets = [];
  state.localDistanceTextId = null;
  const ids = [...state.localOverlayIds, ...state.localUiOverlayIds];
  state.localOverlayIds = [];
  state.localUiOverlayIds = [];
  if (ids.length) await OBR.scene.local.deleteItems(ids).catch(() => {});
}

function enqueuePreviewCurveTask(task) {
  const current = previewCurveQueue.then(task);
  previewCurveQueue = current.catch((error) => {
    console.warn("Régua: falha ao atualizar a linha provisória.", error);
  });
  return current;
}

function updatePreviewCurve(pointer) {
  if (!state.active || state.finalizing || state.points.length === 0) return Promise.resolve();
  const requestedPointer = pointer && Number.isFinite(pointer.x) && Number.isFinite(pointer.y)
    ? { x: pointer.x, y: pointer.y }
    : null;

  return enqueuePreviewCurveTask(async () => {
    if (!state.active || state.finalizing || state.points.length === 0) return;
    const last = state.points[state.points.length - 1];
    const endpoint = requestedPointer || last;
    if (!state.localPreviewId) {
      let builder = buildCurve()
        .id(makeId())
        .name("Prévia local da régua")
        .points([{ ...last }, { ...endpoint }])
        .tension(0)
        .strokeColor(state.style.lineColor)
        .strokeOpacity(0.8 * state.style.lineOpacity / 100)
        .strokeWidth(state.style.lineWidth)
        .fillOpacity(0)
        .layer("DRAWING")
        .zIndex(900)
        .disableAutoZIndex(true)
        .metadata({ [KEY_KIND]: "preview", [KEY_ROUTE]: state.routeId });
      const dash = getLineDash();
      if (dash.length) builder = builder.strokeDash(dash);
      const item = builder.build();
      state.localPreviewId = item.id;
      await OBR.scene.local.addItems([item]);
      return;
    }
    const id = state.localPreviewId;
    await OBR.scene.local.updateItems([id], (items) => {
      if (items.length) items[0].points = [{ ...last }, { ...endpoint }];
    });
  });
}

function clearPreviewCurve() {
  return enqueuePreviewCurveTask(async () => {
    const id = state.localPreviewId;
    state.localPreviewId = null;
    try {
      // Also remove any untracked local preview left by an earlier extension version.
      const localItems = await OBR.scene.local.getItems();
      const ids = localItems
        .filter((item) => item.id === id || getTargetKind(item) === "preview")
        .map((item) => item.id);
      if (ids.length) await OBR.scene.local.deleteItems(ids).catch(() => {});
    } catch (error) {
      console.warn("Régua: não foi possível procurar linhas provisórias antigas.", error);
    }
  });
}

async function stopAndDeleteSharedCurve() {
  const id = state.sharedCurveId;
  if (state.routeInteraction) {
    const [, stop] = state.routeInteraction;
    stop();
    state.routeInteraction = null;
  }
  try {
    // Stopping an item interaction can commit the temporary curve to the scene.
    // Look up every temporary curve for this route, then delete it before making
    // a separate final curve containing only confirmed nodes.
    const staleCurves = await OBR.scene.items.getItems((item) =>
      getTargetKind(item) === "route-preview" && item.metadata?.[KEY_ROUTE] === state.routeId
    );
    const staleIds = new Set(staleCurves.map((item) => item.id));
    if (id) {
      // Give the host a tick to finish committing the stopped interaction before
      // checking whether the temporary item exists in the scene collection.
      await new Promise((resolve) => window.setTimeout(resolve, 25));
      const matchingId = await OBR.scene.items.getItems([id]);
      for (const item of matchingId) staleIds.add(item.id);
    }
    if (staleIds.size) {
      await new Promise((resolve) => window.setTimeout(resolve, 0));
      await OBR.scene.items.deleteItems([...staleIds]);
    }
  } catch (error) {
    console.warn("Régua: não foi possível apagar a curva provisória compartilhada.", error);
    throw error;
  }
  state.sharedCurveId = null;
}

async function markTerrainCell(cell) {
  if (state.grid.type !== "SQUARE") {
    await OBR.notification.show("A marcação de terreno difícil está disponível apenas em grades quadradas.", "WARNING");
    return false;
  }
  const tolerance = Math.max(2, state.grid.dpi * 0.2);
  const exists = state.terrainCells.some((marker) => sameCell(marker, cell, tolerance));
  if (!exists) state.terrainCells.push({ x: cell.x, y: cell.y });
  return true;
}

async function toggleTerrainAtCurrentNode() {
  if (!state.active || state.finalizing || state.points.length === 0) return;
  if (state.grid.type !== "SQUARE") {
    await OBR.notification.show("A marcação de terreno difícil está disponível apenas em grades quadradas.", "WARNING");
    return;
  }
  const cell = state.points[state.points.length - 1];
  const tolerance = Math.max(2, state.grid.dpi * 0.2);
  const existingIndex = state.terrainCells.findIndex((marker) => sameCell(marker, cell, tolerance));
  if (existingIndex >= 0) {
    state.terrainCells.splice(existingIndex, 1);
  } else {
    state.terrainCells.push({ x: cell.x, y: cell.y });
  }
  await renderOverlay();
  await updatePreviewCurve(state.currentPointer || cell);
}

async function confirmRoute() {
  if (!state.active || state.finalizing) return;
  if (state.points.length < 2) {
    await OBR.notification.show("Adicione pelo menos um segundo ponto antes de confirmar a régua.", "WARNING");
    return;
  }

  state.finalizing = true;
  try {
    await waypointQueue;
    // Wait for pending preview updates and remove the line from the last node to
    // the cursor before committing the route's fixed waypoints.
    await clearPreviewCurve();
    await stopAndDeleteSharedCurve();

    const total = await calculateDistance();
    const totalText = formatDistance(total);
    const latest = state.points[state.points.length - 1];
    const latestIsTerrain = state.grid.type === "SQUARE" && isTerrainCell(latest, getTerrainCells(), state.grid.dpi);
    const latestNodeSize = latestIsTerrain ? state.style.terrainNodeSize : state.style.nodeSize;
    const anchorHalfHeight = latestNodeSize / 2;
    // The final route gets its own ID and only the committed waypoints. The
    // interaction/preview curve is never reused as the saved route.
    const routeItem = createCurve(state.points, false, makeId(), totalText, anchorHalfHeight, {
      dataOnly: true,
      routeId: state.routeId,
    });
    await OBR.scene.items.addItems([routeItem]);

    const terrain = getTerrainCells();
    const children = [];
    for (const point of state.points) {
      const isDifficult = state.grid.type === "SQUARE" && isTerrainCell(point, terrain, state.grid.dpi);
      children.push(createNode(point, state.routeId, true, isDifficult, routeItem.id, true));
    }

    if (children.length) await OBR.scene.items.addItems(children);
    await refreshPersistentRouteBadges();
    await clearOverlay();
    await resetRouteState(false);
  } catch (error) {
    state.finalizing = false;
    console.error("Falha ao confirmar a régua.", error);
    await OBR.notification.show("Não foi possível finalizar a régua. Tente novamente.", "ERROR");
  }
}

async function cancelRoute() {
  if (!state.active || state.finalizing) return;
  state.finalizing = true;
  try {
    await waypointQueue;
    await clearPreviewCurve();
    await stopAndDeleteSharedCurve();
    await clearOverlay();
    await restoreAssociatedToken();
  } catch (error) {
    console.error("Falha ao cancelar e limpar a régua provisória.", error);
  } finally {
    await resetRouteState(false);
  }
}

async function resetRouteState(restoreToken) {
  if (restoreToken) await restoreAssociatedToken();
  await clearOverlay();
  await clearPreviewCurve();
  state.active = false;
  state.finalizing = false;
  state.points = [];
  state.routeId = null;
  state.routeInteraction = null;
  state.sharedCurveId = null;
  state.tokenId = null;
  state.tokenOriginalPosition = null;
  state.tokenStartPoint = null;
  state.tokenDimensions = null;
  state.terrainCells = [];
  state.currentPointer = null;
  state.dragging = false;
  state.dragStartPointer = null;
  state.dragStartTarget = null;
  state.dragStartedRoute = false;
  state.shiftWasDown = false;
  state.ctrlWasDown = false;
}

async function undoLastWaypoint() {
  if (!state.active || state.finalizing || state.points.length <= 1) return;
  state.points.pop();

  // Rebuild the terrain markers from the remaining waypoints instead of only
  // removing one approximate coordinate. This prevents a TD marker from living
  // on after Backspace and incorrectly affecting the next normal node.
  const tolerance = Math.max(2, state.grid.dpi * 0.2);
  state.terrainCells = state.terrainCells.filter((marker) =>
    state.points.some((point) => sameCell(marker, point, tolerance))
  );
  state.shiftWasDown = false;
  state.ctrlWasDown = false;

  if (state.points.length < 2 && state.routeInteraction) {
    // Stop and delete the shared temporary curve too; just stopping it can leave
    // a committed ghost segment behind when Backspace returns to the first node.
    await stopAndDeleteSharedCurve();
  } else {
    await syncSharedCurve();
  }
  await moveAssociatedToken(state.points[state.points.length - 1]);
  await renderOverlay();
  await updatePreviewCurve(state.currentPointer);
}

async function handleControl(action) {
  if (action === "confirm") await confirmRoute();
  else if (action === "cancel") await cancelRoute();
  else if (action === "terrain") await toggleTerrainAtCurrentNode();
}

async function handleToolClick(event) {
  if (state.finalizing) return;
  // Local overlays may not always be returned as event.target by the host.
  // Resolve control taps using their scene coordinates first, which also works on touch screens.
  const pointer = event.pointerPosition;
  if (state.active && pointer && Number.isFinite(pointer.x) && Number.isFinite(pointer.y)) {
    const hit = state.controlHitTargets.find((control) =>
      Math.hypot(pointer.x - control.position.x, pointer.y - control.position.y) <= control.size * 0.5
    );
    if (hit) {
      await handleControl(hit.action);
      return;
    }
  }

  const action = getControlAction(event.target);
  if (action) {
    await handleControl(action);
    return;
  }
  await addWaypoint(event.pointerPosition, event.target || null);
}

async function openAppearancePopover(elementId, toolTab = "route") {
  try {
    await OBR.popover.open({
      id: SETTINGS_POPOVER_ID,
      url: appAsset(`settings.html?tool=${encodeURIComponent(toolTab)}`),
      width: 390,
      height: 480,
      anchorElementId: elementId,
    });
  } catch (error) {
    console.error("Não foi possível abrir as opções de aparência.", error);
  }
}

async function applyAppearanceUpdate(message = null) {
  let nextStyle;
  let updatedAt = 0;
  if (message?.metadata && typeof message.metadata === "object") {
    updatedAt = Number(message.updatedAt) || Date.now();
    if (updatedAt < state.styleTimestamp) return;
    nextStyle = normalizeStyle(migrateLegacyDefaults(message.metadata));
    state.styleTimestamp = updatedAt;
    writeLocalAppearance(nextStyle, updatedAt);
  } else {
    nextStyle = await readStyle();
  }
  if (JSON.stringify(nextStyle) === JSON.stringify(state.style)) return;
  state.style = nextStyle;
  shapeState.style = nextStyle;
  if (shapeState.active && shapeState.pointer) {
    await clearShapePreview();
    queueShapePreview(shapeState.pointer);
  }

  // Saved route visuals are local overlays, so refreshing them only changes this player.
  await refreshPersistentRouteBadges();
  if (!state.active || state.finalizing) return;

  // Keep the shared in-progress route untouched; recreate only our local preview
  // and controls so changing personal preferences doesn't alter other players' view.
  await clearPreviewCurve();
  await renderOverlay();
  await updatePreviewCurve(state.currentPointer || state.points[state.points.length - 1]);
}

function createAreaCurve(points, areaId, mode, style, persistent) {
  const prefix = mode === "cone" ? "coneArea" : "circleArea";
  return buildCurve()
    .id(makeId())
    .name(persistent ? `Área de efeito — ${mode === "cone" ? "cone adaptado à grade" : "círculo"}` : "Prévia de área de efeito")
    .points(points.map((point) => ({ x: point.x, y: point.y })))
    .tension(0)
    .closed(true)
    .fillColor(style[`${prefix}FillColor`])
    .fillOpacity(style[`${prefix}FillOpacity`] / 100)
    .strokeColor(style[`${prefix}StrokeColor`])
    .strokeOpacity(style[`${prefix}StrokeOpacity`] / 100)
    .strokeWidth(style[`${prefix}StrokeWidth`])
    .layer("DRAWING")
    .zIndex(persistent ? 1080 : 1800)
    .disableAutoZIndex(true)
    .disableHit(!persistent)
    .metadata({
      [KEY_KIND]: persistent ? "area-shape" : "area-preview",
      [KEY_AREA_ID]: areaId,
      [KEY_AREA_TYPE]: mode,
      [KEY_CREATED]: OBR.player?.id || "unknown",
    })
    .build();
}

function areaStyleSignature(style, mode) {
  const prefix = mode === "cone" ? "coneArea" : "circleArea";
  return [style[`${prefix}FillColor`], style[`${prefix}FillOpacity`], style[`${prefix}StrokeColor`], style[`${prefix}StrokeOpacity`], style[`${prefix}StrokeWidth`]].join("|");
}

function snappedPositionKey(point) {
  return `${Math.round(point.x * 1000) / 1000},${Math.round(point.y * 1000) / 1000}`;
}

function getAreaIndicatorStyle(style) {
  return {
    indicatorBackgroundColor: style.areaIndicatorBackgroundColor,
    indicatorTextColor: style.areaIndicatorTextColor,
    indicatorBorderColor: style.areaIndicatorBorderColor,
    indicatorBorderWidth: style.areaIndicatorBorderWidth,
    indicatorWidth: style.areaIndicatorWidth,
    indicatorHeight: style.areaIndicatorHeight,
    indicatorFontSize: style.areaIndicatorFontSize,
    indicatorOpacity: style.areaIndicatorOpacity,
  };
}

async function updateAreaDistanceIndicator(text, anchor) {
  const areaIndicatorStyle = getAreaIndicatorStyle(shapeState.style);
  const height = areaIndicatorStyle.indicatorHeight;
  const center = {
    x: anchor.x,
    y: anchor.y - (shapeState.grid.dpi * 0.18) - height / 2 - 5,
  };
  if (!shapeState.indicatorIds.length) {
    const items = createDistancePillItems(text, center, {
      [KEY_KIND]: "area-distance",
      [KEY_AREA_ID]: `area-distance-${shapeState.generation}`,
      [KEY_AREA_TYPE]: shapeState.mode,
    }, {
      name: "Indicador de distância da área",
      backgroundLayer: "CONTROL",
      textLayer: "CONTROL",
      style: areaIndicatorStyle,
    });
    await OBR.scene.local.addItems(items);
    shapeState.indicatorIds = items.map((item) => item.id);
    shapeState.indicatorAnchor = center;
    return;
  }
  const oldCenter = shapeState.indicatorAnchor || center;
  const dx = center.x - oldCenter.x;
  const dy = center.y - oldCenter.y;
  await OBR.scene.local.updateItems(shapeState.indicatorIds, (items) => {
    for (const item of items) {
      item.position = { x: item.position.x + dx, y: item.position.y + dy };
      if (item.type === "TEXT") item.text.plainText = text;
    }
  });
  shapeState.indicatorAnchor = center;
}

async function updateAreaDistanceText(text) {
  if (!shapeState.indicatorIds.length) return;
  await OBR.scene.local.updateItems(shapeState.indicatorIds, (items) => {
    for (const item of items) {
      if (item.type === "TEXT" && item.text) item.text.plainText = text;
    }
  });
}

async function persistAreaDistanceIndicator(areaId) {
  if (!shapeState.indicatorIds.length) return;
  const ids = new Set(shapeState.indicatorIds);
  const localItems = await OBR.scene.local.getItems();
  const indicatorItems = localItems.filter((item) => ids.has(item.id));
  if (!indicatorItems.length) return;
  const persistentItems = indicatorItems.map((item) => ({
    ...item,
    id: makeId(),
    metadata: {
      ...(item.metadata || {}),
      [KEY_KIND]: "area-distance-persistent",
      [KEY_AREA_ID]: areaId,
      [KEY_AREA_TYPE]: shapeState.mode,
      [KEY_CREATED]: OBR.player?.id || "unknown",
    },
  }));
  // Clone the currently rendered items without recalculating their position.
  // This leaves the distance pill exactly where it appeared during measuring.
  await OBR.scene.items.addItems(persistentItems);
}

async function startShape(rawPoint) {
  if (shapeState.active) return shapeState.startPromise;
  shapeState.active = true;
  shapeState.starting = true;
  shapeState.finalizing = false;
  shapeState.pointer = { ...rawPoint };
  shapeState.generation += 1;
  shapeState.lastSnappedKey = null;
  shapeState.startPromise = (async () => {
    try {
      const [origin, grid, style] = await Promise.all([snapToCell(rawPoint), readGrid(), readStyle()]);
      shapeState.origin = origin;
      shapeState.grid = grid;
      shapeState.style = style;
      state.style = style;
      let basis = getDefaultGridBasis(origin, grid);
      if (!basis) {
        basis = await discoverIsometricBasis(origin, grid, (point) => OBR.scene.grid.snapPosition(point, 1, false, true));
      }
      shapeState.basis = basis;
      await queueShapePreview(rawPoint);
    } catch (error) {
      console.error("Não foi possível iniciar a régua de formas.", error);
      shapeState.active = false;
      shapeState.origin = null;
    } finally {
      shapeState.starting = false;
    }
  })();
  return shapeState.startPromise;
}

function queueShapePreview(rawPointer) {
  if (!shapeState.active || shapeState.finalizing || !rawPointer) return;
  shapeState.pendingPointer = { ...rawPointer };
  if (shapeState.previewWorkerRunning) return;
  shapeState.previewWorkerRunning = true;
  void (async () => {
    try {
      while (shapeState.pendingPointer && shapeState.active && !shapeState.finalizing) {
        const pointer = shapeState.pendingPointer;
        shapeState.pendingPointer = null;
        await renderShapePreview(pointer);
      }
    } catch (error) {
      console.warn("Não foi possível atualizar a prévia da área de efeito.", error);
    } finally {
      shapeState.previewWorkerRunning = false;
      if (shapeState.pendingPointer && shapeState.active && !shapeState.finalizing) {
        queueShapePreview(shapeState.pendingPointer);
      }
    }
  })();
}

async function renderShapePreview(rawPointer) {
  const generation = shapeState.generation;
  const pointer = await snapToCell(rawPointer);
  if (generation !== shapeState.generation || !shapeState.active || shapeState.finalizing || !shapeState.origin) return;
  const cellKey = snappedPositionKey(pointer);
  if (cellKey === shapeState.lastSnappedKey) return;
  shapeState.lastSnappedKey = cellKey;
  shapeState.pointer = { ...rawPointer };

  const geometry = computeAreaGeometry(shapeState.origin, pointer, shapeState.mode, shapeState.grid, shapeState.basis);
  shapeState.lastGeometry = geometry;
  shapeState.tooLarge = geometry.tooLarge;
  if (generation !== shapeState.generation || !shapeState.active || shapeState.finalizing) return;
  await updateAreaDistanceIndicator(formatDistance(geometry.maxDistance, shapeState.grid), pointer);

  if (geometry.tooLarge || !geometry.points.length) {
    if (shapeState.previewShapeId) {
      await OBR.scene.local.deleteItems([shapeState.previewShapeId]).catch(() => {});
      shapeState.previewShapeId = null;
      shapeState.previewIds = [];
      shapeState.previewStyleSignature = null;
    }
    return;
  }

  const signature = areaStyleSignature(shapeState.style, shapeState.mode);
  if (!shapeState.previewShapeId || signature !== shapeState.previewStyleSignature) {
    if (shapeState.previewShapeId) {
      await OBR.scene.local.deleteItems([shapeState.previewShapeId]).catch(() => {});
    }
    const item = createAreaCurve(geometry.points, `preview-${generation}`, shapeState.mode, shapeState.style, false);
    await OBR.scene.local.addItems([item]);
    if (generation !== shapeState.generation || !shapeState.active || shapeState.finalizing) {
      await OBR.scene.local.deleteItems([item.id]).catch(() => {});
      return;
    }
    shapeState.previewShapeId = item.id;
    shapeState.previewIds = [item.id];
    shapeState.previewStyleSignature = signature;
  } else {
    await OBR.scene.local.updateItems([shapeState.previewShapeId], (items) => {
      for (const item of items) item.points = geometry.points.map((point) => ({ x: point.x, y: point.y }));
    });
  }

}

async function clearShapePreview() {
  shapeState.generation += 1;
  shapeState.pendingPointer = null;
  shapeState.previewIds = [];
  shapeState.previewShapeId = null;
  shapeState.previewStyleSignature = null;
  shapeState.indicatorIds = [];
  shapeState.indicatorAnchor = null;
  shapeState.lastSnappedKey = null;
  try {
    const items = await OBR.scene.local.getItems();
    const ids = items.filter((item) => ["area-preview", "area-distance"].includes(getTargetKind(item))).map((item) => item.id);
    if (ids.length) await OBR.scene.local.deleteItems(ids);
  } catch (error) {
    console.warn("Não foi possível limpar a prévia da régua de formas.", error);
  }
}

async function resetShapeState(clearPreview = true) {
  if (clearPreview) await clearShapePreview();
  shapeState.active = false;
  shapeState.starting = false;
  shapeState.startPromise = null;
  shapeState.finalizing = false;
  shapeState.origin = null;
  shapeState.pointer = null;
  shapeState.grid = null;
  shapeState.basis = null;
  shapeState.lastGeometry = null;
  shapeState.tooLarge = false;
  shapeState.previewShapeId = null;
  shapeState.previewStyleSignature = null;
  shapeState.lastSnappedKey = null;
  shapeState.indicatorIds = [];
  shapeState.indicatorAnchor = null;
  shapeState.drag = null;
}

async function finalizeShape(rawPointer) {
  if (!shapeState.active || shapeState.finalizing || !shapeState.origin) return;
  shapeState.finalizing = true;
  shapeState.pendingPointer = null;
  try {
    const pointer = await snapToCell(rawPointer);
    const geometry = computeAreaGeometry(shapeState.origin, pointer, shapeState.mode, shapeState.grid, shapeState.basis);
    if (geometry.tooLarge || !geometry.points.length) {
      await OBR.notification.show(`A área ultrapassou o limite de ${MAX_AREA_RADIUS} casas ou ${MAX_AREA_CELLS} casas abrangidas.`, "WARNING");
      await clearShapePreview();
      return;
    }
    const areaId = makeId();
    const item = createAreaCurve(geometry.points, areaId, shapeState.mode, shapeState.style, true);

    // Update only the text, not the pill's position: its last on-map position
    // is intentionally retained when the user confirms the area.
    if (!shapeState.indicatorIds.length) {
      await updateAreaDistanceIndicator(formatDistance(geometry.maxDistance, shapeState.grid), pointer);
    } else {
      await updateAreaDistanceText(formatDistance(geometry.maxDistance, shapeState.grid));
    }
    await OBR.scene.items.addItems([item]);
    try {
      await persistAreaDistanceIndicator(areaId);
    } catch (indicatorError) {
      console.warn("A forma foi criada, mas não foi possível manter seu indicador de distância.", indicatorError);
    }
    await clearShapePreview();
    const confirmation = shapeState.mode === "cone"
      ? (shapeState.grid.type === "HEX_VERTICAL" || shapeState.grid.type === "HEX_HORIZONTAL"
        ? "Cone criado na grade hexagonal (12 direções alinhadas à grade)."
        : "Cone criado com largura em degraus alinhada à grade (8 direções).")
      : `Área circular criada (${geometry.cells.length} casas abrangidas).`;
    await OBR.notification.show(confirmation, "INFO");
  } catch (error) {
    console.error("Não foi possível salvar a área de efeito.", error);
    await OBR.notification.show("Não foi possível criar a área de efeito. Consulte o console do navegador.", "ERROR");
  } finally {
    await resetShapeState(false);
  }
}

async function handleShapeToolClick(event) {
  if (shapeState.ignoreNextClick) {
    shapeState.ignoreNextClick = false;
    return;
  }
  if (shapeState.finalizing || !event.pointerPosition) return;
  if (!shapeState.active) {
    await startShape(event.pointerPosition);
  } else {
    if (shapeState.starting && shapeState.startPromise) await shapeState.startPromise;
    await finalizeShape(event.pointerPosition);
  }
}

function createShapeMode(mode, icon, label, id) {
  return {
    id,
    icons: [{ icon, label, filter: { activeTools: [SHAPES_TOOL_ID] } }],
    onActivate() {
      if (shapeState.active) void resetShapeState(true);
      shapeState.mode = mode;
    },
    onToolClick(_context, event) {
      void handleShapeToolClick(event);
      return false;
    },
    onToolMove(_context, event) {
      if (shapeState.active && event.pointerPosition) {
        shapeState.pointer = { ...event.pointerPosition };
        queueShapePreview(event.pointerPosition);
      }
    },
    onToolDragStart(_context, event) {
      shapeState.drag = {
        start: { ...event.pointerPosition },
        activeAtStart: shapeState.active,
        didMove: false,
        startedForDrag: false,
      };
    },
    onToolDragMove(_context, event) {
      const drag = shapeState.drag;
      if (!drag || !event.pointerPosition) return;
      if (Math.hypot(event.pointerPosition.x - drag.start.x, event.pointerPosition.y - drag.start.y) > 6) {
        drag.didMove = true;
        if (!shapeState.active && !drag.startedForDrag) {
          drag.startedForDrag = true;
          void startShape(drag.start).then(() => queueShapePreview(event.pointerPosition));
        } else if (shapeState.active) {
          shapeState.pointer = { ...event.pointerPosition };
          queueShapePreview(event.pointerPosition);
        }
      }
    },
    onToolDragEnd(_context, event) {
      const drag = shapeState.drag;
      shapeState.drag = null;
      if (!drag || !drag.didMove || !event.pointerPosition) return;
      shapeState.ignoreNextClick = true;
      setTimeout(() => { shapeState.ignoreNextClick = false; }, 250);
      void (async () => {
        if (!shapeState.active) await startShape(drag.start);
        if (shapeState.starting && shapeState.startPromise) await shapeState.startPromise;
        if (shapeState.active) await finalizeShape(event.pointerPosition);
      })();
    },
    onToolDragCancel() {
      const drag = shapeState.drag;
      shapeState.drag = null;
      if (drag?.startedForDrag && !drag.activeAtStart) void resetShapeState(true);
    },
    onKeyDown(_context, event) {
      if (event.repeat) return;
      const key = event.key || event.code;
      if ((key === "Escape" || key === "Delete") && shapeState.active) {
        void resetShapeState(true);
      } else if (key === "Enter" && shapeState.active && shapeState.pointer) {
        void finalizeShape(shapeState.pointer);
      }
    },
    onDeactivate() {
      if (shapeState.active) void resetShapeState(true);
    },
  };
}

async function createShapeTools() {
  await OBR.tool.create({
    id: SHAPES_TOOL_ID,
    icons: [{ icon: appAsset("shapes.svg"), label: "Réguas de Formas" }],
    defaultMode: CIRCLE_MODE_ID,
  });
  await OBR.tool.createMode(createShapeMode("circle", appAsset("circle.svg"), "Área circular", CIRCLE_MODE_ID));
  await OBR.tool.createMode(createShapeMode("cone", appAsset("cone.svg"), "Cone adaptado à grade", CONE_MODE_ID));
  await OBR.tool.createAction({
    id: SHAPE_SETTINGS_ACTION_ID,
    icons: [{ icon: appAsset("settings.svg"), label: "Personalizar formas", filter: { activeTools: [SHAPES_TOOL_ID] } }],
    onClick(_context, elementId) { void openAppearancePopover(elementId, shapeState.mode); },
  });
}

async function createExtensionTools() {
  await OBR.tool.create({
    id: TOOL_ID,
    icons: [{ icon: appAsset("ruler.svg"), label: "Régua de Percurso" }],
    defaultMode: MODE_ID,
    defaultMetadata: { ...DEFAULT_STYLE },
  });

  await OBR.tool.createMode({
    id: MODE_ID,
    icons: [{ icon: appAsset("ruler.svg"), label: "Adicionar pontos", filter: { activeTools: [TOOL_ID] } }],
    onActivate() {
      void readStyle().then((style) => { state.style = style; });
    },
    onToolClick(_context, event) {
      void handleToolClick(event);
      return false;
    },
    onToolMove(_context, event) {
      state.currentPointer = event.pointerPosition;
      if (state.active) void throttledPreviewUpdate(event.pointerPosition);
    },
    onToolDragStart(_context, event) {
      state.dragging = true;
      state.dragStartPointer = { ...event.pointerPosition };
      state.dragStartTarget = event.target || null;
      state.currentPointer = { ...event.pointerPosition };
      state.dragStartedRoute = false;
      state.shiftWasDown = Boolean(event.shiftKey);
      state.ctrlWasDown = Boolean(event.ctrlKey);
    },
    onToolDragMove(_context, event) {
      state.currentPointer = { ...event.pointerPosition };
      const start = state.dragStartPointer;
      if (!state.active && !state.dragStartedRoute && start && Math.hypot(event.pointerPosition.x - start.x, event.pointerPosition.y - start.y) > 10) {
        state.dragStartedRoute = true;
        void addWaypoint(start, state.dragStartTarget);
      }
      if (state.active) {
        void throttledPreviewUpdate(event.pointerPosition);
        if (event.ctrlKey && !state.ctrlWasDown) {
          state.ctrlWasDown = true;
          void addWaypoint(event.pointerPosition);
        } else if (!event.ctrlKey) {
          state.ctrlWasDown = false;
        }
        if (event.shiftKey && !state.shiftWasDown) {
          state.shiftWasDown = true;
          void addWaypoint(event.pointerPosition, null, { terrain: true });
        } else if (!event.shiftKey) {
          state.shiftWasDown = false;
        }
      }
    },
    onToolDragEnd(_context, event) {
      const startedByDrag = state.dragStartedRoute;
      state.dragging = false;
      state.dragStartPointer = null;
      state.shiftWasDown = false;
      state.ctrlWasDown = false;
      if (startedByDrag) {
        void addWaypoint(event.pointerPosition);
      }
      state.dragStartTarget = null;
      state.dragStartedRoute = false;
    },
    onToolDragCancel() {
      state.dragging = false;
      state.dragStartPointer = null;
      state.dragStartTarget = null;
      state.shiftWasDown = false;
      state.ctrlWasDown = false;
    },
    onKeyDown(_context, event) {
      if (event.repeat || state.finalizing) return;
      const key = event.key || event.code;
      if ((key === "Control" || event.code === "ControlLeft" || event.code === "ControlRight") && !state.ctrlWasDown) {
        state.ctrlWasDown = true;
        if (state.currentPointer) void addWaypoint({ ...state.currentPointer });
      } else if ((key === "Shift" || event.code === "ShiftLeft" || event.code === "ShiftRight") && !state.shiftWasDown) {
        state.shiftWasDown = true;
        if (state.currentPointer) void addWaypoint({ ...state.currentPointer }, null, { terrain: true });
      } else if (key === "Backspace" && state.active && state.points.length > 1) {
        void undoLastWaypoint();
      } else if (key === "Enter" && state.active) {
        void confirmRoute();
      } else if ((key === "Delete" || event.code === "Delete") && state.active) {
        void cancelRoute();
      } else if ((key === "Escape" || event.code === "Escape") && state.active) {
        void cancelRoute();
      }
    },
    onKeyUp(_context, event) {
      const key = event.key || event.code;
      if (key === "Shift" || event.code === "ShiftLeft" || event.code === "ShiftRight") state.shiftWasDown = false;
      if (key === "Control" || event.code === "ControlLeft" || event.code === "ControlRight") state.ctrlWasDown = false;
    },
    onDeactivate() {
      if (state.active) void cancelRoute();
    },
  });

  await OBR.tool.createAction({
    id: SETTINGS_ACTION_ID,
    icons: [{ icon: appAsset("settings.svg"), label: "Personalizar percurso", filter: { activeTools: [TOOL_ID] } }],
    onClick(_context, elementId) {
      void openAppearancePopover(elementId, "route");
    },
  });
}

let previewUpdateScheduled = false;
let queuedPreviewPosition = null;
async function throttledPreviewUpdate(position) {
  queuedPreviewPosition = position;
  const now = Date.now();
  if (now - state.lastPreviewUpdate < 28 || previewUpdateScheduled) return;
  previewUpdateScheduled = true;
  state.lastPreviewUpdate = now;
  try {
    await updatePreviewCurve(queuedPreviewPosition);
    await updateDistancePreview(queuedPreviewPosition);
  } finally {
    previewUpdateScheduled = false;
  }
}

OBR.onReady(async () => {
  try {
      await createExtensionTools();
      await createShapeTools();
    OBR.broadcast.onMessage(APPEARANCE_BROADCAST_CHANNEL, (event) => {
      if (event.data?.type !== "appearance-update") return;
      void applyAppearanceUpdate(event.data).catch((error) => {
        console.error("Não foi possível aplicar a aparência em tempo real.", error);
      });
    });
    state.style = await readStyle();
    state.grid = await readGrid();
    await migrateTerrainMarkers();
    await migrateLegacyDistanceLabels();
    await clearStaleLocalRouteVisuals();
    await migrateRoutesToLocalRendering();
    OBR.scene.items.onChange((items) => { void refreshPersistentRouteBadges(items); });
    await refreshPersistentRouteBadges();
    console.info("Régua de Percurso 0.3.16 carregada.");
    await OBR.notification.show("Régua de Percurso 0.3.16 carregada", "INFO");
  } catch (error) {
    console.error("Falha ao registrar as ferramentas da Régua de Percurso 0.3.16.", error);
    try {
      await OBR.notification.show(
        "A Régua de Percurso não conseguiu registrar a ferramenta. Consulte o Console do navegador.",
        "ERROR"
      );
    } catch (notificationError) {
      console.error("Também não foi possível mostrar o aviso de falha.", notificationError);
    }
  }
});
