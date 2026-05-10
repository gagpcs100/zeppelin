export async function loadObjText(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Erro ao carregar OBJ: ${url}`);
  }

  return response.text();
}

// Este arquivo ficou preparado para expansão.
// Nesta versão inicial, os objetos são criados com primitivas geométricas da TWGL.
export function parseObjPlaceholder() {
  return null;
}
