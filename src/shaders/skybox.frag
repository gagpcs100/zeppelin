#version 300 es
precision highp float;

in vec3 v_position;

out vec4 outColor;

void main() {
  float height = normalize(v_position).y;
  vec3 bottomColor = vec3(0.55, 0.75, 0.95);
  vec3 topColor = vec3(0.08, 0.18, 0.45);

  vec3 color = mix(bottomColor, topColor, height * 0.5 + 0.5);
  outColor = vec4(color, 1.0);
}
