// Limita `value` ao intervalo [min, max].
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function createMaterial({
  color = [1, 1, 1, 1],
  specular = [1, 1, 1, 1],
  shininess = 32,
  texture = null,
  useTexture = false,
} = {}) {
  return {
    color,
    specular,
    shininess,
    texture,
    useTexture,
  };
}
