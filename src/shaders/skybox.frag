#version 300 es
precision highp float;

in vec3 v_position;

// Cores do gradiente do céu, definidas por hora do dia (ver dayCycle.js).
uniform vec3 u_skyZenith;
uniform vec3 u_skyHorizon;

out vec4 outColor;

void main() {
  float height = normalize(v_position).y;
  float t = clamp(height * 0.5 + 0.5, 0.0, 1.0);
  vec3 color = mix(u_skyHorizon, u_skyZenith, t);
  outColor = vec4(color, 1.0);
}
