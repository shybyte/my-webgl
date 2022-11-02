// language=glsl
export const SKYBOX_VERTEX_SHADER_SRC = `#version 300 es
  in vec4 a_position;
  out vec4 v_position;
  void main() {
    v_position = a_position;
    gl_Position = a_position;
    gl_Position.z = 1.0;
  }
`;

// language=glsl
export const SKYBOX_FRAGMENT_SHADER_SRC = `#version 300 es
  precision highp float;
  
  uniform samplerCube u_skybox;
  uniform mat4 u_viewDirectionProjectionInverse;
  
  in vec4 v_position;
  
  // we need to declare an output for the fragment shader
  out vec4 outColor;
  
  void main() {
    vec4 t = u_viewDirectionProjectionInverse * v_position;
    outColor = texture(u_skybox, normalize(t.xyz / t.w));
  }
`;
