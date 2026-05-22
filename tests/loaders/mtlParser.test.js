import { describe, it, expect } from "vitest";
import { parseMtl } from "../../src/loaders/mtlParser.js";

describe("parseMtl", () => {
  it("lê um material simples com cores e shininess", () => {
    const text = `
newmtl pedra
Ka 0.1 0.1 0.1
Kd 0.6 0.5 0.4
Ks 0.8 0.8 0.8
Ns 32
d 1.0
`;
    const mats = parseMtl(text);
    expect(mats.pedra.diffuse).toEqual([0.6, 0.5, 0.4]);
    expect(mats.pedra.specular).toEqual([0.8, 0.8, 0.8]);
    expect(mats.pedra.shininess).toBe(32);
    expect(mats.pedra.opacity).toBe(1.0);
    expect(mats.pedra.map).toBe(null);
  });

  it("captura nome de textura com espaços", () => {
    const text = `newmtl casa\nmap_Kd Castle Exterior Texture.jpg\n`;
    const mats = parseMtl(text);
    expect(mats.casa.map).toBe("Castle Exterior Texture.jpg");
  });

  it("força diffuse branco quando o material tem textura", () => {
    const text = `newmtl fh\nKd 0.0 0.0 0.0\nmap_Kd Farmhouse Texture.jpg\n`;
    const mats = parseMtl(text);
    expect(mats.fh.diffuse).toEqual([1, 1, 1]);
    expect(mats.fh.map).toBe("Farmhouse Texture.jpg");
  });

  it("ignora linhas desconhecidas (bump, illum, Ni, comentários)", () => {
    const text = `# comentario\nnewmtl m\nillum 4\nNi 1.0\nbump x.jpg -bm 0.1\nKd 0.2 0.3 0.4\n`;
    const mats = parseMtl(text);
    expect(mats.m.diffuse).toEqual([0.2, 0.3, 0.4]);
  });
});
