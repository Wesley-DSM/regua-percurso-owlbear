const MAX_AREA_CELLS = 2500;
const MAX_AREA_RADIUS = 50;
const EPSILON = 1e-7;

export function getCellDistance(dx, dy, measurement) {
  const x = Math.abs(Math.round(dx));
  const y = Math.abs(Math.round(dy));
  if (measurement === "MANHATTAN") return x + y;
  if (measurement === "EUCLIDEAN") return Math.hypot(dx, dy);
  if (measurement === "ALTERNATING") {
    const diagonal = Math.min(x, y);
    const straight = Math.max(x, y) - diagonal;
    // Diagonals alternate between 1 and 2 movement points.
    return straight + Math.floor(diagonal / 2) * 3 + (diagonal % 2);
  }
  return Math.max(x, y); // CHEBYSHEV and compatible defaults
}

export function getDefaultGridBasis(origin, grid) {
  const dpi = grid?.dpi || 70;
  if (grid.type === "HEX_VERTICAL") {
    return { u: { x: dpi, y: 0 }, v: { x: dpi / 2, y: Math.sqrt(3) * dpi / 2 } };
  }
  if (grid.type === "HEX_HORIZONTAL") {
    return { u: { x: 0, y: dpi }, v: { x: Math.sqrt(3) * dpi / 2, y: dpi / 2 } };
  }
  if (grid.type === "SQUARE") {
    return { u: { x: dpi, y: 0 }, v: { x: 0, y: dpi } };
  }
  return null;
}

function keyPoint(point) {
  return `${Math.round(point.x * 1000) / 1000},${Math.round(point.y * 1000) / 1000}`;
}

function add(a, b) { return { x: a.x + b.x, y: a.y + b.y }; }
function scale(v, k) { return { x: v.x * k, y: v.y * k }; }
function subtract(a, b) { return { x: a.x - b.x, y: a.y - b.y }; }
function cross(a, b) { return a.x * b.y - a.y * b.x; }
function dot(a, b) { return a.x * b.x + a.y * b.y; }

export async function discoverIsometricBasis(origin, grid, snapPosition) {
  const dpi = grid?.dpi || 70;
  const radius = dpi * 1.55;
  const samples = Array.from({ length: 32 }, (_, i) => {
    const angle = (Math.PI * 2 * i) / 32;
    return { x: origin.x + Math.cos(angle) * radius, y: origin.y + Math.sin(angle) * radius };
  });
  const snapped = await Promise.all(samples.map((point) => snapPosition(point).catch(() => point)));
  const candidates = new Map();
  for (const point of snapped) {
    const vector = subtract(point, origin);
    const length = Math.hypot(vector.x, vector.y);
    if (length < dpi * 0.2 || length > dpi * 2.1) continue;
    candidates.set(keyPoint(point), { vector, length });
  }
  const sorted = [...candidates.values()].sort((a, b) => a.length - b.length);
  if (sorted.length < 2) return { u: { x: dpi, y: 0 }, v: { x: 0, y: dpi } };
  const shortest = sorted[0].length;
  const nearestRing = sorted.filter((candidate) => candidate.length <= shortest * 1.4 + 0.5);
  const first = nearestRing[0] || sorted[0];
  let second = null;
  let bestScore = -Infinity;
  for (const candidate of nearestRing.slice(1)) {
    const area = Math.abs(cross(first.vector, candidate.vector)) / (first.length * candidate.length);
    if (area < 0.25) continue;
    // Prefer an adjacent lattice direction rather than a nearly opposite one.
    const angleScore = 1 - Math.abs(dot(first.vector, candidate.vector) / (first.length * candidate.length));
    const score = area + angleScore * 0.1 - Math.abs(candidate.length - first.length) / Math.max(1, first.length) * 0.01;
    if (score > bestScore) { bestScore = score; second = candidate; }
  }
  if (!second) second = sorted.find((candidate) => Math.abs(cross(first.vector, candidate.vector)) > first.length * candidate.length * 0.25);
  if (!second) return { u: { x: dpi, y: 0 }, v: { x: 0, y: dpi } };
  return { u: first.vector, v: second.vector };
}

function getLatticeCoordinates(origin, point, basis) {
  const delta = subtract(point, origin);
  const determinant = cross(basis.u, basis.v);
  if (Math.abs(determinant) < 0.001) return { q: 0, r: 0 };
  return {
    q: Math.round(cross(delta, basis.v) / determinant),
    r: Math.round(cross(basis.u, delta) / determinant),
  };
}

function getHexDistance(q, r, measurement, basis, grid) {
  if (measurement === "EUCLIDEAN") {
    const vector = add(scale(basis.u, q), scale(basis.v, r));
    return Math.hypot(vector.x, vector.y) / (grid.dpi || 70);
  }
  return Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r));
}

function getMovementDistance(q, r, grid, basis) {
  if (grid.measurement === "EUCLIDEAN") {
    // Measure in the actual grid basis, which matters when isometric and
    // dimetric cells are transformed instead of being perpendicular squares.
    const vector = add(scale(basis.u, q), scale(basis.v, r));
    return Math.hypot(vector.x, vector.y) / (grid.dpi || 70);
  }
  if (grid.type === "HEX_VERTICAL" || grid.type === "HEX_HORIZONTAL") {
    return getHexDistance(q, r, grid.measurement, basis, grid);
  }
  return getCellDistance(q, r, grid.measurement);
}

function getCellCenter(origin, q, r, basis) {
  return add(origin, add(scale(basis.u, q), scale(basis.v, r)));
}

function polygonArea(points) {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length];
    area += a.x * b.y - b.x * a.y;
  }
  return area / 2;
}

function getCellPolygon(cell, grid, basis) {
  const { x, y } = cell.center;
  const dpi = grid.dpi || 70;
  let points;
  if (grid.type === "HEX_VERTICAL" || grid.type === "HEX_HORIZONTAL") {
    const pointyTop = grid.type === "HEX_VERTICAL";
    const radius = dpi / Math.sqrt(3);
    const start = pointyTop ? -Math.PI / 2 : 0;
    points = Array.from({ length: 6 }, (_, index) => {
      const angle = start + index * Math.PI / 3;
      return { x: x + Math.cos(angle) * radius, y: y + Math.sin(angle) * radius };
    });
  } else if (grid.type === "SQUARE") {
    points = [
      { x: x - dpi / 2, y: y - dpi / 2 },
      { x: x + dpi / 2, y: y - dpi / 2 },
      { x: x + dpi / 2, y: y + dpi / 2 },
      { x: x - dpi / 2, y: y + dpi / 2 },
    ];
  } else {
    const hu = scale(basis.u, 0.5), hv = scale(basis.v, 0.5);
    points = [
      subtract(subtract(cell.center, hu), hv),
      subtract(add(cell.center, hu), hv),
      add(add(cell.center, hu), hv),
      add(subtract(cell.center, hu), hv),
    ];
  }
  if (polygonArea(points) < 0) points.reverse();
  return points;
}

function signedTurn(incoming, outgoing) {
  let angle = Math.atan2(cross(incoming, outgoing), dot(incoming, outgoing));
  if (angle < -1e-8) angle += Math.PI * 2;
  return angle;
}

function traceBoundary(cells, grid, basis) {
  const edges = new Map();
  for (const cell of cells) {
    const polygon = cell.polygon || getCellPolygon(cell, grid, basis);
    for (let i = 0; i < polygon.length; i++) {
      const from = polygon[i], to = polygon[(i + 1) % polygon.length];
      const fromKey = keyPoint(from), toKey = keyPoint(to);
      const key = `${fromKey}>${toKey}`;
      const reverse = `${toKey}>${fromKey}`;
      if (edges.has(reverse)) edges.delete(reverse);
      else edges.set(key, { from, to, fromKey, toKey });
    }
  }
  if (!edges.size) return [];
  const outgoing = new Map();
  for (const [key, edge] of edges) {
    if (!outgoing.has(edge.fromKey)) outgoing.set(edge.fromKey, []);
    outgoing.get(edge.fromKey).push(key);
  }
  const loops = [];
  while (edges.size) {
    const firstKey = edges.keys().next().value;
    const first = edges.get(firstKey);
    edges.delete(firstKey);
    const points = [first.from, first.to];
    const startKey = first.fromKey;
    let currentKey = first.toKey;
    let previousVector = subtract(first.to, first.from);
    let guard = 0;
    while (currentKey !== startKey && guard++ <= MAX_AREA_CELLS * 8) {
      const nextKeys = (outgoing.get(currentKey) || []).filter((key) => edges.has(key));
      if (!nextKeys.length) break;
      let chosenKey = nextKeys[0], bestTurn = Infinity;
      for (const key of nextKeys) {
        const edge = edges.get(key);
        const turn = signedTurn(previousVector, subtract(edge.to, edge.from));
        if (turn < bestTurn) { bestTurn = turn; chosenKey = key; }
      }
      const next = edges.get(chosenKey);
      edges.delete(chosenKey);
      points.push(next.to);
      previousVector = subtract(next.to, next.from);
      currentKey = next.toKey;
    }
    if (currentKey === startKey && points.length >= 4) loops.push(points.slice(0, -1));
  }
  if (!loops.length) return convexHull(cells.flatMap((cell) => cell.polygon || getCellPolygon(cell, grid, basis)));
  loops.sort((a, b) => Math.abs(polygonArea(b)) - Math.abs(polygonArea(a)));
  return loops[0];
}

function convexHull(points) {
  const sorted = [...new Map(points.map((point) => [keyPoint(point), point])).values()]
    .sort((a, b) => a.x - b.x || a.y - b.y);
  if (sorted.length <= 3) return sorted;
  const build = (sequence) => {
    const half = [];
    for (const point of sequence) {
      while (half.length >= 2 && cross(subtract(half[half.length - 1], half[half.length - 2]), subtract(point, half[half.length - 1])) <= 0) half.pop();
      half.push(point);
    }
    return half;
  };
  return [...build(sorted).slice(0, -1), ...build(sorted.slice().reverse()).slice(0, -1)];
}

function clipPolygonHalfPlane(points, origin, evaluate) {
  if (!points.length) return [];
  const output = [];
  let previous = points[points.length - 1];
  let previousValue = evaluate({ x: previous.x - origin.x, y: previous.y - origin.y });
  for (const current of points) {
    const currentValue = evaluate({ x: current.x - origin.x, y: current.y - origin.y });
    const previousInside = previousValue >= -EPSILON;
    const currentInside = currentValue >= -EPSILON;
    if (previousInside !== currentInside) {
      const denominator = previousValue - currentValue;
      const t = Math.abs(denominator) < EPSILON ? 0 : previousValue / denominator;
      output.push({ x: previous.x + (current.x - previous.x) * t, y: previous.y + (current.y - previous.y) * t });
    }
    if (currentInside) output.push(current);
    previous = current;
    previousValue = currentValue;
  }
  return output;
}

function polygonIntersectsCone(polygon, origin, targetAngle, halfAngle) {
  if (polygon.length < 3) return false;
  const lowerRay = { x: Math.cos(targetAngle - halfAngle), y: Math.sin(targetAngle - halfAngle) };
  const upperRay = { x: Math.cos(targetAngle + halfAngle), y: Math.sin(targetAngle + halfAngle) };
  // Rasterize the angular sector against the complete cell polygon, but keep
  // the cell whole. This includes boundary cells when a cone passes through
  // them and avoids diagonal-only islands when the direction matches a corner.
  let clipped = clipPolygonHalfPlane(polygon, origin, (point) => cross(lowerRay, point));
  clipped = clipPolygonHalfPlane(clipped, origin, (point) => -cross(upperRay, point));
  return clipped.length >= 3 && Math.abs(polygonArea(clipped)) > EPSILON;
}

function angularDifference(a, b) {
  return Math.atan2(Math.sin(a - b), Math.cos(a - b));
}

function isHexGrid(grid) {
  return grid.type === "HEX_VERTICAL" || grid.type === "HEX_HORIZONTAL";
}

function positiveAngle(angle) {
  const full = Math.PI * 2;
  return ((angle % full) + full) % full;
}

function getConeDirections(grid, basis) {
  if (isHexGrid(grid)) {
    // Hex grids expose the six neighbor axes plus the six directions halfway
    // between them. The latter are valid headings even when no cell center lies
    // directly on the heading.
    const neighbors = [
      basis.u,
      basis.v,
      subtract(basis.v, basis.u),
      scale(basis.u, -1),
      scale(basis.v, -1),
      subtract(basis.u, basis.v),
    ];
    const axes = neighbors
      .map((vector) => positiveAngle(Math.atan2(vector.y, vector.x)))
      .sort((a, b) => a - b);
    const midpoints = axes.map((angle, index) => {
      const next = index === axes.length - 1 ? axes[0] + Math.PI * 2 : axes[index + 1];
      return positiveAngle((angle + next) / 2);
    });
    return [...axes, ...midpoints].map((angle) => ({ angle, q: null, r: null }));
  }

  // Store the lattice vector alongside its screen angle. Choosing by the angle
  // lets the user aim visually, while the footprint itself is calculated in
  // grid coordinates (so isometric/dimetric grids stay aligned to their cells).
  const directions = [
    { q: 1, r: 0, vector: basis.u },
    { q: 0, r: 1, vector: basis.v },
    { q: 1, r: 1, vector: add(basis.u, basis.v) },
    { q: 1, r: -1, vector: subtract(basis.u, basis.v) },
    { q: -1, r: 0, vector: scale(basis.u, -1) },
    { q: 0, r: -1, vector: scale(basis.v, -1) },
    { q: -1, r: -1, vector: scale(add(basis.u, basis.v), -1) },
    { q: -1, r: 1, vector: scale(subtract(basis.u, basis.v), -1) },
  ];
  return directions.map(({ q, r, vector }) => ({
    q,
    r,
    angle: positiveAngle(Math.atan2(vector.y, vector.x)),
  }));
}

function getConeDirection(origin, pointer, grid, basis) {
  const vector = subtract(pointer, origin);
  const pointerAngle = Math.atan2(vector.y, vector.x);
  const directions = getConeDirections(grid, basis);
  let best = directions[0] || { angle: pointerAngle, q: 1, r: 0 };
  let bestDifference = Infinity;
  for (const direction of directions) {
    const difference = Math.abs(angularDifference(pointerAngle, direction.angle));
    if (difference < bestDifference) {
      bestDifference = difference;
      best = direction;
    }
  }
  return best;
}

function getConeHalfAngle(grid) {
  // For hexagonal grids, a 60-degree sector follows the natural cell geometry;
  // the 12 headings are spaced at 30-degree intervals.
  return isHexGrid(grid) ? Math.PI / 6 : Math.PI / 8;
}

function cellInsideDiscreteCone(q, r, direction) {
  // A square/isometric cone widens by one cell on each side every two forward
  // grid steps. This raster rule is intentional: at 5 m on an alternating-
  // diagonal square grid, the rows are exactly:
  // ----+- / --++++ / ++++++ / --++++ / ----+-
  // The range's movement-cost rule is checked separately by computeAreaGeometry.
  const normSquared = direction.q * direction.q + direction.r * direction.r;
  if (!normSquared) return q === 0 && r === 0;
  const forward = (q * direction.q + r * direction.r) / normSquared;
  const lateral = Math.abs(q * direction.r - r * direction.q) / normSquared;
  if (forward < -EPSILON) return false;
  const lateralLimit = Math.floor(forward / 2 + EPSILON);
  return lateral <= lateralLimit + EPSILON;
}

export function computeAreaGeometry(origin, pointer, mode, grid, basis) {
  if (!origin || !pointer || !grid?.dpi || !basis) return { points: [], cells: [], maxDistance: 0, tooLarge: false };
  const end = getLatticeCoordinates(origin, pointer, basis);
  const maxDistance = getMovementDistance(end.q, end.r, grid, basis);
  if (!Number.isFinite(maxDistance) || maxDistance > MAX_AREA_RADIUS) return { points: [], cells: [], maxDistance, tooLarge: true };
  const bound = Math.min(MAX_AREA_RADIUS + 1, Math.ceil(maxDistance) + 1);
  const coneDirection = mode === "cone" ? getConeDirection(origin, pointer, grid, basis) : null;
  const coneHalfAngle = mode === "cone" ? getConeHalfAngle(grid) : 0;
  const cells = [];
  for (let q = -bound; q <= bound; q++) {
    for (let r = -bound; r <= bound; r++) {
      const distance = getMovementDistance(q, r, grid, basis);
      if (distance > maxDistance + EPSILON) continue;
      const center = getCellCenter(origin, q, r, basis);
      // Build the area from full cells selected by their centers, then trace
      // the outside perimeter of that union. This makes both lateral edges
      // follow the grid's cell borders instead of cutting across them as straight
      // geometric rays. The final area is still one closed vector shape.
      const polygon = getCellPolygon({ center }, grid, basis);
      if (mode === "cone") {
        const insideCone = isHexGrid(grid)
          ? polygonIntersectsCone(polygon, origin, coneDirection.angle, coneHalfAngle)
          : cellInsideDiscreteCone(q, r, coneDirection);
        if (!insideCone) continue;
      }
      cells.push({ q, r, center, distance, polygon });
      if (cells.length > MAX_AREA_CELLS) return { points: [], cells: [], maxDistance, tooLarge: true };
    }
  }
  const points = traceBoundary(cells, grid, basis);
  return { points, cells, maxDistance, tooLarge: false };
}
