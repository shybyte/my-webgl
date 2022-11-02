import { mat4 } from 'gl-matrix';
import { createMyBuffer, createProgram, MyBuffer, setProgramAttributeToMyBuffer } from '../../my-utils';
import { SKYBOX_FRAGMENT_SHADER_SRC, SKYBOX_VERTEX_SHADER_SRC } from './shader';

export class Skybox {
  private readonly positionBuffer: MyBuffer;
  private readonly program: WebGLProgram;
  private readonly skyboxLocation: WebGLUniformLocation;
  private readonly viewDirectionProjectionInverseLocation: WebGLUniformLocation;
  private readonly viewMatrix = mat4.create();
  private readonly viewProjectionMatrix = mat4.create();

  constructor(gl: WebGL2RenderingContext) {
    this.positionBuffer = createMyBuffer(gl, [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1], 2);
    this.program = createProgram(gl, SKYBOX_VERTEX_SHADER_SRC, SKYBOX_FRAGMENT_SHADER_SRC);
    this.skyboxLocation = gl.getUniformLocation(this.program, 'u_skybox')!;
    this.viewDirectionProjectionInverseLocation = gl.getUniformLocation(
      this.program,
      'u_viewDirectionProjectionInverse',
    )!;

    this.loadTextures(gl);
  }

  private loadTextures(gl: WebGL2RenderingContext) {
    // Create a texture.
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

    const faceInfos = [
      {
        target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
        url: './skybox-images/pos-x.jpg',
      },
      {
        target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
        url: './skybox-images/neg-x.jpg',
      },
      {
        target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
        url: './skybox-images/pos-y.jpg',
      },
      {
        target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
        url: './skybox-images/neg-y.jpg',
      },
      {
        target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
        url: './skybox-images/pos-z.jpg',
      },
      {
        target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
        url: './skybox-images/neg-z.jpg',
      },
    ];
    faceInfos.forEach((faceInfo) => {
      const { target, url } = faceInfo;

      // Upload the canvas to the cubemap face.
      const level = 0;
      const internalFormat = gl.RGBA;
      const width = 512;
      const height = 512;
      const format = gl.RGBA;
      const type = gl.UNSIGNED_BYTE;

      // setup each face so it's immediately renderable
      gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);

      // Asynchronously load an image
      const image = new Image();
      image.src = '../sky-box/' + url;
      image.addEventListener('load', function () {
        // Now that the image has loaded make copy it to the texture.
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        gl.texImage2D(target, level, internalFormat, format, type, image);
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
      });
    });
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  }

  render(gl: WebGL2RenderingContext, viewMatrixArg: mat4, projectionMatrixArg: mat4) {
    gl.useProgram(this.program);
    setProgramAttributeToMyBuffer(gl, this.program, 'a_position', this.positionBuffer);

    const viewMatrix = mat4.copy(this.viewMatrix, viewMatrixArg);
    // We only care about direction, so remove the translation.
    viewMatrix[12] = 0;
    viewMatrix[13] = 0;
    viewMatrix[14] = 0;

    mat4.multiply(this.viewProjectionMatrix, projectionMatrixArg, viewMatrix);
    mat4.invert(this.viewProjectionMatrix, this.viewProjectionMatrix);

    gl.uniformMatrix4fv(this.viewDirectionProjectionInverseLocation, false, this.viewProjectionMatrix);
    gl.uniform1i(this.skyboxLocation, 0);

    // let our quad pass the depth test at 1.0
    gl.depthFunc(gl.LEQUAL);

    gl.drawArrays(gl.TRIANGLES, 0, this.positionBuffer.length);
  }
}
