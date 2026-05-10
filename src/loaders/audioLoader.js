export function createAudio(src, loop = true, volume = 0.4) {
  const audio = new Audio(src);
  audio.loop = loop;
  audio.volume = volume;
  return audio;
}
