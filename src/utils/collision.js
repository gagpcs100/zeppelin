export function distance2D(a, b) {
  const dx = a[0] - b[0];
  const dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dz * dz);
}

export function isInsideCircle(point, center, radius) {
  return distance2D(point, center) <= radius;
}
