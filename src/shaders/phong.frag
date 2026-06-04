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

// Luzes pontuais (e spotlights). cosCutoff < 0 → omni; >= 0 → cone.
const int MAX_POINT_LIGHTS = 12;
uniform int u_pointLightCount;
uniform vec3 u_pointLightPos[MAX_POINT_LIGHTS];
uniform vec3 u_pointLightColor[MAX_POINT_LIGHTS];
uniform float u_pointLightRange[MAX_POINT_LIGHTS];
uniform vec3 u_pointLightDir[MAX_POINT_LIGHTS];
uniform float u_pointLightCosCutoff[MAX_POINT_LIGHTS];

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

  // Contribuição da luz direcional (sol/lua).
  vec3 color =
    baseColor.rgb * u_ambientLight +
    baseColor.rgb * u_diffuseLight * diffuseAmount +
    u_specularColor.rgb * u_specularLight * specularAmount;

  // Contribuição das luzes pontuais/spotlights.
  for (int i = 0; i < u_pointLightCount; i++) {
    vec3 toLight = u_pointLightPos[i] - v_worldPosition;
    float dist = length(toLight);
    vec3 L = toLight / max(dist, 0.0001);

    float r = u_pointLightRange[i];
    float att = clamp(1.0 - (dist * dist) / (r * r), 0.0, 1.0);
    att *= att;

    // Cone do spotlight (quando cosCutoff >= 0).
    if (u_pointLightCosCutoff[i] >= 0.0) {
      float spot = dot(normalize(-L), normalize(u_pointLightDir[i]));
      float edge = mix(u_pointLightCosCutoff[i], 1.0, 0.5);
      att *= smoothstep(u_pointLightCosCutoff[i], edge, spot);
    }

    if (att > 0.0) {
      float d = max(dot(normal, L), 0.0);
      vec3 h = normalize(L + viewDirection);
      float s = d > 0.0 ? pow(max(dot(normal, h), 0.0), u_shininess) : 0.0;
      color += att * (baseColor.rgb * u_pointLightColor[i] * d
                    + u_specularColor.rgb * u_pointLightColor[i] * s);
    }
  }

  if (u_fogEnabled) {
    float dist = length(u_cameraPosition - v_worldPosition);
    float fogAmount = smoothstep(300.0, 1200.0, dist);
    color = mix(color, u_fogColor, fogAmount);
  }

  outColor = vec4(color, baseColor.a);
}
