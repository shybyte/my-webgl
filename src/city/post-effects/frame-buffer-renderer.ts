import { createMyBuffer, createProgram, MyBuffer, setProgramAttributeToMyBuffer } from '../../my-utils';
import { FrameBuffer } from '../utils/frame-buffer';

export class FrameBufferRenderer {
  private readonly program: WebGLProgram;
  private readonly positionBuffer: MyBuffer;
  private readonly texCoordBuffer: MyBuffer;

  constructor(private gl: WebGL2RenderingContext) {
    this.program = createProgram(gl, VERTEX_SHADER_SRC, FRAGMENT_SHADER_SRC);

    // prettier-ignore
    this.positionBuffer = createMyBuffer(gl, [
      -1, -1,
      1, -1,
      -1, 1,
      -1, 1,
      1, -1,
      1, 1
    ], 2);

    // prettier-ignore
    this.texCoordBuffer = createMyBuffer(gl, [
      0.0, 0.0,
      1.0, 0.0,
      0.0, 1.0,
      0.0, 1.0,
      1.0, 0.0,
      1.0, 1.0,
    ], 2);
  }

  render(frameBuffer: FrameBuffer) {
    const gl = this.gl;
    const program = this.program;

    const TEXTURE_ID = 0;
    gl.activeTexture(gl.TEXTURE0 + TEXTURE_ID);
    gl.bindTexture(gl.TEXTURE_2D, frameBuffer.targetTexture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.useProgram(program);
    const imageLocation = gl.getUniformLocation(program, 'u_image');
    gl.uniform1i(imageLocation, TEXTURE_ID);

    setProgramAttributeToMyBuffer(gl, this.program, 'a_position', this.positionBuffer);
    setProgramAttributeToMyBuffer(gl, this.program, 'a_texCoord', this.texCoordBuffer);

    gl.vertexAttribDivisor(gl.getAttribLocation(program, 'a_position'), 0);
    gl.vertexAttribDivisor(gl.getAttribLocation(program, 'a_texCoord'), 0);

    gl.drawArrays(gl.TRIANGLES, 0, this.positionBuffer.length);
  }
}

// language=glsl
const VERTEX_SHADER_SRC = `#version 300 es

in vec2 a_position;
in vec2 a_texCoord;

out vec2 v_texCoord;

void main() {
  gl_Position = vec4(a_position, 0, 1);

  // pass the texCoord to the fragment shader
  // The GPU will interpolate this value between points.
  v_texCoord = a_texCoord;
}
`;

// language=glsl
const FRAGMENT_SHADER_SRC = `#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

// our texture
uniform sampler2D u_image;

// the texCoords passed in from the vertex shader.
in vec2 v_texCoord;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
  outColor = texture(u_image, v_texCoord) * 2.0;
}
`;
