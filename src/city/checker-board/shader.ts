// language=glsl
export const CHECKER_BOARD_VERTEX_SHADER_SRC = `#version 300 es
precision mediump float;

in vec3 position;
in vec3 color;
in vec3 normal;

uniform mat4 projection, modelview;
uniform mat4 normalMatrix;

out vec2 texCoord;
out vec3 normalInterp;
out vec3 vertPos;
out float fogDepth;

void main() {
  texCoord = position.xz;
  vec4 vertPos4 = modelview * vec4(position, 1.0);
  vertPos = vec3(vertPos4) / vertPos4.w;
  normalInterp = vec3(normalMatrix * vec4(normal, 0.0));
  fogDepth = -(vertPos4).z;
  gl_Position = projection * vertPos4;
}
`;

// language=glsl
export const CHECKER_BOARD_FRAGMENT_SHADER_SRC = `#version 300 es
precision mediump float;

in vec2 texCoord;
in vec3 normalInterp;// Surface normal
in vec3 vertPos;// Vertex position
in float fogDepth;

const vec3 vColor = vec3(1.0, 1.0, 1.0);
const float Ka = 1.0;// Ambient reflection coefficient
const float Kd = 1.0;// Diffuse reflection coefficient
const float Ks = 1.0;// Specular reflection coefficient
const float shininessVal = 5.0;// Shininess
const vec3 specularColor = vec3(0.2, 0.2, 0.5);
const vec3 lightPos = vec3(0.0, 10.0, -20.0);// Light position

out vec4 finalColor;

void main() {
  float checkSize = 1.0;
  float fmodResult = mod(floor(checkSize * texCoord.x) + floor(checkSize * texCoord.y), 2.0);
  float checkerBoardOnOff = max(sign(fmodResult), 0.0);

  vec3 ambientColor = 0.1 * vColor * checkerBoardOnOff;
  vec3 diffuseColor = vColor * checkerBoardOnOff;

  vec3 N = normalize(normalInterp);
  vec3 L = normalize(lightPos - vertPos);

  // Lambert's cosine law
  float lambertian = max(dot(N, L), 0.0);
  float specular = 0.0;
  if (lambertian > 0.0) {
    vec3 R = reflect(-L, N);// Reflected light vector
    vec3 V = normalize(-vertPos);// Vector to viewer
    // Compute the specular term
    float specAngle = max(dot(R, V), 0.0);
    specular = pow(specAngle, shininessVal);
  }

  const float u_fogNear = 5.0;
  const float u_fogFar = 15.0;
  const vec4 fogColor = vec4(0.0, 0.0, 0.0, 1.0);
  float fogAmount = smoothstep(u_fogNear, u_fogFar, fogDepth);

  vec4 lightnedColor = vec4(Ka * ambientColor +
  Kd * lambertian * diffuseColor +
  Ks * specular * specularColor, 1.0);

  finalColor = mix(lightnedColor, fogColor, fogAmount);
}
`;
