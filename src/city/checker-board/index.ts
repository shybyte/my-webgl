import {
  createMyBuffer,
  createProgram,
  MyBuffer,
  repeat,
  scaleVertexData,
  setProgramAttributeToMyBuffer,
} from '../../my-utils';
import { mat4 } from 'gl-matrix';
import { CHECKER_BOARD_FRAGMENT_SHADER_SRC, CHECKER_BOARD_VERTEX_SHADER_SRC } from './shader';

interface UniformLocations {
  normalMatrix: WebGLUniformLocation;
  projection: WebGLUniformLocation;
  modelview: WebGLUniformLocation;
}

export class CheckerBoard {
  private positionBuffer: MyBuffer;
  private normalBuffer: MyBuffer;
  private program: WebGLProgram;
  private uniformLocations: UniformLocations;
  private modelMatrix = mat4.create();
  private mvMatrix = mat4.create();
  private normalMatrix = mat4.create();

  constructor(gl: WebGL2RenderingContext) {
    // prettier-ignore
    const vertexData = [
      -1, 0, -1, // left back
      -1, 0, 1,  // left front
      1, 0, -1, // right back
      1, 0, -1, // right back
      -1, 0, 1,  // left front
      1, 0, 1, // right front
    ];

    scaleVertexData(vertexData, [100, 0, 100]);

    const normalData = repeat(6, [0, 1, 0]);

    this.positionBuffer = createMyBuffer(gl, vertexData);
    this.normalBuffer = createMyBuffer(gl, normalData);

    this.program = createProgram(gl, CHECKER_BOARD_VERTEX_SHADER_SRC, CHECKER_BOARD_FRAGMENT_SHADER_SRC);

    setProgramAttributeToMyBuffer(gl, this.program, 'position', this.positionBuffer);
    setProgramAttributeToMyBuffer(gl, this.program, 'normal', this.normalBuffer);

    this.uniformLocations = {
      normalMatrix: gl.getUniformLocation(this.program, `normalMatrix`)!,
      projection: gl.getUniformLocation(this.program, 'projection')!,
      modelview: gl.getUniformLocation(this.program, `modelview`)!,
    };
  }

  render(gl: WebGL2RenderingContext, viewMatrix: mat4, projectionMatrix: mat4) {
    gl.useProgram(this.program);

    mat4.multiply(this.mvMatrix, viewMatrix, this.modelMatrix);
    mat4.invert(this.normalMatrix, this.mvMatrix);
    mat4.transpose(this.normalMatrix, this.normalMatrix);

    gl.uniformMatrix4fv(this.uniformLocations.projection, false, projectionMatrix);
    gl.uniformMatrix4fv(this.uniformLocations.modelview, false, this.mvMatrix);
    gl.uniformMatrix4fv(this.uniformLocations.normalMatrix, false, this.normalMatrix);

    gl.drawArrays(gl.TRIANGLES, 0, this.positionBuffer.length);
  }
}
