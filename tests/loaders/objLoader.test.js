import { describe, it, expect } from "vitest";
import { parseObj, resolveAssetUrl } from "../../src/loaders/objLoader.js";

describe("resolveAssetUrl", () => {
  it("prefixa o base do Vite a um caminho absoluto", () => {
    expect(resolveAssetUrl("/models/x.obj", "/zeppelin/")).toBe(
      "/zeppelin/models/x.obj"
    );
  });

  it("aceita caminho sem barra inicial", () => {
    expect(resolveAssetUrl("models/x.obj", "/zeppelin/")).toBe(
      "/zeppelin/models/x.obj"
    );
  });

  it("não duplica barras quando o base é a raiz", () => {
    expect(resolveAssetUrl("/models/x.obj", "/")).toBe("/models/x.obj");
  });
});

describe("parseObj", () => {
  it("devolve um grupo único quando não há usemtl", () => {
    const text = `v 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3\n`;
    const result = parseObj(text);
    expect(result.mtllib).toBe(null);
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].material).toBe(null);
    expect(result.groups[0].positions).toHaveLength(9);
  });

  it("captura o nome do mtllib", () => {
    const text = `mtllib casa.mtl\nv 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3\n`;
    expect(parseObj(text).mtllib).toBe("casa.mtl");
  });

  it("divide a geometria em um grupo por usemtl", () => {
    const text = [
      "v 0 0 0", "v 1 0 0", "v 0 1 0", "v 1 1 0",
      "usemtl vermelho", "f 1 2 3",
      "usemtl azul", "f 2 4 3",
    ].join("\n");
    const result = parseObj(text);
    expect(result.groups).toHaveLength(2);
    expect(result.groups[0].material).toBe("vermelho");
    expect(result.groups[1].material).toBe("azul");
    expect(result.groups[0].positions).toHaveLength(9);
    expect(result.groups[1].positions).toHaveLength(9);
  });

  it("funde faces do mesmo material quando usemtl se repete (intercalado)", () => {
    const text = [
      "v 0 0 0", "v 1 0 0", "v 0 1 0", "v 1 1 0",
      "usemtl a", "f 1 2 3",
      "usemtl b", "f 2 4 3",
      "usemtl a", "f 1 2 4",
    ].join("\n");
    const result = parseObj(text);
    expect(result.groups).toHaveLength(2); // 'a' e 'b', não 3
    const a = result.groups.find((g) => g.material === "a");
    expect(a.positions).toHaveLength(18); // 2 triângulos fundidos
  });

  it("triangula faces de 4 vértices em leque", () => {
    const text = [
      "v 0 0 0", "v 1 0 0", "v 1 1 0", "v 0 1 0",
      "f 1 2 3 4",
    ].join("\n");
    expect(parseObj(text).groups[0].positions).toHaveLength(18);
  });
});
