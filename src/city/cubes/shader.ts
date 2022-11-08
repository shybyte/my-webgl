// language=glsl
export const CUBE_VERTEX_SHADER_SRC = `#version 300 es
precision mediump float;

in vec3 position;
in vec3 aOffset;
in vec3 aScale;
in vec3 color;
in vec3 normal;

out vec3 vColor;

uniform int selectedInstanceId;
uniform mat4 projection, modelview;
uniform mat4 normalMatrix;

out vec3 normalInterp;
out vec3 vertPos;

void main() {
  vColor = selectedInstanceId == gl_InstanceID ? vec3(1.0,1.0,1.0) : color;
  vec4 vertPos4 = modelview * vec4(position * aScale + aOffset, 1.0);
  vertPos = vec3(vertPos4) / vertPos4.w;
  normalInterp = vec3(normalMatrix * vec4(normal, 0.0));
  gl_Position = projection * vertPos4;
}
`;

// language=glsl
export const CUBE_FRAGMENT_SHADER_SRC = `#version 300 es
precision mediump float;

in vec3 vColor;
in vec3 normalInterp;// Surface normal
in vec3 vertPos;// Vertex position

uniform int mode;// Rendering mode

const float Ka = 1.0;// Ambient reflection coefficient
const float Kd = 1.0;// Diffuse reflection coefficient
const float Ks = 1.0;// Specular reflection coefficient
const float shininessVal = 80.0;// Shininess
const vec3 specularColor = vec3(1.0, 1.0, 1.0);
const vec3 lightPos = vec3(0.0, 10.0, 0.0);// Light position

out vec4 finalColor;

void main() {
  vec3 ambientColor = 0.2 * vColor;
  vec3 diffuseColor = vColor;
  
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
  finalColor = vec4(Ka * ambientColor +
  Kd * lambertian * diffuseColor +
  Ks * specular * specularColor, 1.0);

  // only ambient
  if (mode == 2) finalColor = vec4(Ka * ambientColor, 1.0);
  // only diffuse
  if (mode == 3) finalColor = vec4(Kd * lambertian * diffuseColor, 1.0);
  // only specular
  if (mode == 4) finalColor = vec4(Ks * specular * specularColor, 1.0);
}
`;
