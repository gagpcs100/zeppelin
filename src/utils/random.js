export function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

export function randomChoice(items) {
  return items[Math.floor(Math.random() * items.length)];
}
