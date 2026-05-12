export function distance2D(a, b) {
  const dx = a[0] - b[0];
  const dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dz * dz);
}

export function isInsideCircle(point, center, radius) {
  return distance2D(point, center) <= radius;
}

export function clampToCircle(point, center, radius) {
  const dx = point[0] - center[0];
  const dz = point[2] - center[2];
  const d = Math.sqrt(dx * dx + dz * dz);

  if (d <= radius || d === 0) {
    return [point[0], point[1], point[2]];
  }

  const scale = radius / d;
  return [
    center[0] + dx * scale,
    point[1],
    center[2] + dz * scale,
  ];
}

export function resolveWallCollision(prevPos, newPos, wallRadius, wallHeight, marginXZ, marginY) {
  // Se o zeppelin está acima do topo da muralha (com margem), atravessa livre.
  if (newPos[1] >= wallHeight + marginY) {
    return [newPos[0], newPos[1], newPos[2]];
  }

  const dPrev = Math.sqrt(prevPos[0] * prevPos[0] + prevPos[2] * prevPos[2]);
  const dNew = Math.sqrt(newPos[0] * newPos[0] + newPos[2] * newPos[2]);

  const sidePrev = Math.sign(dPrev - wallRadius);
  const sideNew = Math.sign(dNew - wallRadius);

  // Mesmo lado (ou exatamente em cima): nada a fazer.
  if (sidePrev === sideNew || sidePrev === 0) {
    return [newPos[0], newPos[1], newPos[2]];
  }

  // Cruzou: reposiciona no raio (R + lado * margem), do lado de onde veio.
  const targetRadius = wallRadius + sidePrev * marginXZ;

  // Se dNew == 0, escolhemos uma direção arbitrária (X) — caso degenerado.
  if (dNew === 0) {
    return [targetRadius, newPos[1], 0];
  }

  const scale = targetRadius / dNew;
  return [newPos[0] * scale, newPos[1], newPos[2] * scale];
}
