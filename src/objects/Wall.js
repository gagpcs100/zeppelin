import * as twgl from "twgl.js";
import { composeTransform } from "../math/transformations.js";
import { createMaterial } from "../utils/helpers.js";

// Cria muralhas formadas por vários blocos e merlões no topo
export function createWall(gl, textures, { radius, height, color }) {
  const thickness = 3.5;
  // Ajusta o número de segmentos proporcional ao raio
  const segments = Math.max(32, Math.floor(radius * 1.5));
  const circumference = 2 * Math.PI * radius;
  const segmentLength = circumference / segments;

  const cubeBuffer = twgl.primitives.createCubeBufferInfo(gl, 1);
  const parts = [];

  const wallMaterial = createMaterial({
    color,
    texture: textures.wall,
    useTexture: true,
    shininess: 12,
  });

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    // Base da muralha
    parts.push({
      bufferInfo: cubeBuffer,
      world: composeTransform({
        translation: [x, height / 2, z],
        rotation: [0, -angle, 0],
        scale: [thickness, height, segmentLength * 1.05],
      }),
      material: wallMaterial,
    });

    // Merlões (crenellations) no topo
    if (i % 2 === 0) {
      parts.push({
        bufferInfo: cubeBuffer,
        world: composeTransform({
          translation: [x, height + 1.25, z],
          rotation: [0, -angle, 0],
          scale: [thickness * 0.9, 2.5, segmentLength * 0.8],
        }),
        material: wallMaterial,
      });
    }
  }

  // Adicionar distritos (semi-círculos projetados para fora nos 4 pontos cardeais) - Estilo Attack on Titan
  const distRadius = radius * 0.18;
  const distSegments = Math.max(16, Math.floor(distRadius * 1.5));
  const distCircumference = Math.PI * distRadius;
  const distSegmentLength = distCircumference / distSegments;

  for (let k = 0; k < 4; k++) {
    const mainAngle = (k * Math.PI) / 2;
    const cx = Math.cos(mainAngle) * radius;
    const cz = Math.sin(mainAngle) * radius;

    for (let j = 0; j <= distSegments; j++) {
      const arcAngle = mainAngle - Math.PI / 2 + (j / distSegments) * Math.PI;
      const x = cx + Math.cos(arcAngle) * distRadius;
      const z = cz + Math.sin(arcAngle) * distRadius;

      // Base do distrito
      parts.push({
        bufferInfo: cubeBuffer,
        world: composeTransform({
          translation: [x, height / 2, z],
          rotation: [0, -arcAngle, 0],
          scale: [thickness, height, distSegmentLength * 1.1],
        }),
        material: wallMaterial,
      });

      // Merlões do distrito
      if (j % 2 === 0) {
        parts.push({
          bufferInfo: cubeBuffer,
          world: composeTransform({
            translation: [x, height + 1.25, z],
            rotation: [0, -arcAngle, 0],
            scale: [thickness * 0.9, 2.5, distSegmentLength * 0.8],
          }),
          material: wallMaterial,
        });
      }
    }
  }

  return { parts };
}

export function drawWall(gl, programInfo, wall, commonUniforms, drawPart) {
  for (const part of wall.parts) {
    drawPart(gl, programInfo, part.bufferInfo, part.world, part.material, commonUniforms);
  }
}
