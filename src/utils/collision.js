// Colisão simples por caixa envolvente (AABB). O mundo é um único modelo
// .obj; o zeppelin é mantido dentro dos limites horizontais dessa caixa.

// Limita um ponto ao retângulo [min, max] no plano XZ, recuado por `margin`.
// O eixo Y não é tocado (a altura é tratada à parte, por min/maxHeight).
export function clampToBounds(point, bounds, margin = 0) {
  const clampAxis = (value, lo, hi) => {
    const a = lo + margin;
    const b = hi - margin;
    if (a >= b) return (lo + hi) / 2; // caixa menor que a margem: usa o centro
    return Math.min(Math.max(value, a), b);
  };

  return [
    clampAxis(point[0], bounds.min[0], bounds.max[0]),
    point[1],
    clampAxis(point[2], bounds.min[2], bounds.max[2]),
  ];
}
