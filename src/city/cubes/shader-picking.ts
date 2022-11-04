// language=glsl
export const CUBE_PICKING_VERTEX_SHADER_SRC = `#version 300 es
precision mediump float;

in vec3 position;
in vec3 aOffset;
in vec3 aScale;

out vec3 vColor;

uniform mat4 projection, modelview;

void main() {
  int pickingId = gl_InstanceID + 1;
  int red = (pickingId >> 0) & 0xFF;
  int green = (pickingId >> 8) & 0xFF;
  int blue = (pickingId >> 16) & 0xFF;
  
  vColor = vec3(float(red) / 255.0, float(green) / 255.0 , float(blue) / 255.0);
  vec4 vertPos4 = modelview * vec4(position * aScale + aOffset, 1.0);
  gl_Position = projection * vertPos4;
}
`;

// language=glsl
export const CUBE_PICKING_FRAGMENT_SHADER_SRC = `#version 300 es
precision mediump float;

in vec3 vColor;
out vec4 finalColor;

void main() {
  finalColor = vec4(vColor, 1.0);
}
`;
