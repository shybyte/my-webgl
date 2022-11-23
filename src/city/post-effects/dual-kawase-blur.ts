// language=glsl
export const FRAGMENT_SHADER_DOWN_SAMPLE_SRC = `#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

// our texture
uniform sampler2D u_image;

// the texCoords passed in from the vertex shader.
in vec2 v_texCoord;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main()
{
  vec2 uv = v_texCoord * 2.0;
  vec2 halfpixel = vec2(1.0, 1.0) / float(textureSize(u_image, 0)) / 2.0; // gets size of half texel
  // vec2 halfpixel = 0.5 / (iResolution.xy / 2.0);
  float offset = 3.0;

  vec4 sum = texture(u_image, uv) * 4.0;
  sum += texture(u_image, uv - halfpixel.xy * offset);
  sum += texture(u_image, uv + halfpixel.xy * offset);
  sum += texture(u_image, uv + vec2(halfpixel.x, -halfpixel.y) * offset);
  sum += texture(u_image, uv - vec2(halfpixel.x, -halfpixel.y) * offset);

  outColor = sum / 4.0;
}
`;
