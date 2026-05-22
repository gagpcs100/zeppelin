#version 300 es
precision highp float;

in vec3 v_normal;
in vec3 v_worldPosition;
in vec2 v_texcoord;

uniform vec3 u_cameraPosition;

uniform vec3 u_lightDirection;
uniform vec3 u_ambientLight;
uniform vec3 u_diffuseLight;
uniform vec3 u_specularLight;

uniform vec4 u_diffuseColor;
uniform vec4 u_specularColor;
uniform float u_shininess;

uniform sampler2D u_texture;
uniform bool u_useTexture;
uniform bool u_lightingEnabled;
uniform bool u_fogEnabled;
uniform vec3 u_fogColor;

out vec4 outColor;

void main() {
  vec4 baseColor = u_diffuseColor;

  if (u_useTexture) {
    baseColor *= texture(u_texture, v_texcoord);
  }

  if (!u_lightingEnabled) {
    outColor = baseColor;
    return;
  }

  vec3 normal = normalize(v_normal);
  vec3 lightDirection = normalize(-u_lightDirection);
  vec3 viewDirection = normalize(u_cameraPosition - v_worldPosition);
  vec3 halfVector = normalize(lightDirection + viewDirection);

  float diffuseAmount = max(dot(normal, lightDirection), 0.0);
  float specularAmount = 0.0;

  if (diffuseAmount > 0.0) {
    specularAmount = pow(max(dot(normal, halfVector), 0.0), u_shininess);
  }

  vec3 color =
    baseColor.rgb * u_ambientLight +
    baseColor.rgb * u_diffuseLight * diffuseAmount +
    u_specularColor.rgb * u_specularLight * specularAmount;

  if (u_fogEnabled) {
    // Distâncias casadas com a escala do mundo (~1800 unidades de lado). A
    // cor da névoa acompanha o céu (passada por drawScene).
    float dist = length(u_cameraPosition - v_worldPosition);
    float fogAmount = smoothstep(300.0, 1200.0, dist);
    color = mix(color, u_fogColor, fogAmount);
  }

  outColor = vec4(color, baseColor.a);
}
