import {
  createMyBuffer,
  createProgram,
  MyBuffer,
  randomColor,
  scaleVertexData,
  setProgramAttributeToMyBuffer,
} from '../../my-utils';
import { mat4 } from 'gl-matrix';
import { CUBE_FRAGMENT_SHADER_SRC, CUBE_VERTEX_SHADER_SRC } from './shader';
import { cubeNormalData, cubeVertexData } from './cube';

const CUBE_COUNT = 500;

interface UniformLocations {
  normalMatrix: WebGLUniformLocation;
  projection: WebGLUniformLocation;
  modelview: WebGLUniformLocation;
}

export class Cubes {
  private positionBuffer: MyBuffer;
  private normalBuffer: MyBuffer;
  private offsetBuffer: MyBuffer;
  private colorBuffer: MyBuffer;

  private program: WebGLProgram;

  private uniformLocations: UniformLocations;

  private modelMatrix = mat4.create();
  private mvMatrix = mat4.create();
  private normalMatrix = mat4.create();

  constructor(gl: WebGL2RenderingContext) {
    const offsetData = [];
    const cubeCloudSize = 5;
    for (let i = 0; i < CUBE_COUNT; i++) {
      offsetData.push((Math.random() - 0.5) * cubeCloudSize, 0.1, (Math.random() - 0.5) * cubeCloudSize);
    }

    const colorData = [1, 0, 0];
    for (let i = 0; i < CUBE_COUNT - 1; i++) {
      colorData.push(...randomColor());
    }

    this.positionBuffer = createMyBuffer(gl, scaleVertexData([...cubeVertexData], [0.2, 0.2, 0.2]));
    this.normalBuffer = createMyBuffer(gl, cubeNormalData);

    this.offsetBuffer = createMyBuffer(gl, offsetData);
    this.colorBuffer = createMyBuffer(gl, colorData);

    this.program = createProgram(gl, CUBE_VERTEX_SHADER_SRC, CUBE_FRAGMENT_SHADER_SRC);

    const offsetLocation = gl.getAttribLocation(this.program, 'aOffset');
    const colorLocation = gl.getAttribLocation(this.program, 'color');
    gl.vertexAttribDivisor(offsetLocation, 1);
    gl.vertexAttribDivisor(colorLocation, 1);

    this.uniformLocations = {
      normalMatrix: gl.getUniformLocation(this.program, `normalMatrix`)!,
      projection: gl.getUniformLocation(this.program, 'projection')!,
      modelview: gl.getUniformLocation(this.program, `modelview`)!,
    };
  }

  render(gl: WebGL2RenderingContext, viewMatrix: mat4, projectionMatrix: mat4) {
    gl.useProgram(this.program);

    setProgramAttributeToMyBuffer(gl, this.program, 'position', this.positionBuffer);
    setProgramAttributeToMyBuffer(gl, this.program, 'normal', this.normalBuffer);
    setProgramAttributeToMyBuffer(gl, this.program, 'aOffset', this.offsetBuffer);
    setProgramAttributeToMyBuffer(gl, this.program, 'color', this.colorBuffer);

    mat4.multiply(this.mvMatrix, viewMatrix, this.modelMatrix);
    mat4.invert(this.normalMatrix, this.mvMatrix);
    mat4.transpose(this.normalMatrix, this.normalMatrix);

    gl.uniformMatrix4fv(this.uniformLocations.projection, false, projectionMatrix);
    gl.uniformMatrix4fv(this.uniformLocations.modelview, false, this.mvMatrix);
    gl.uniformMatrix4fv(this.uniformLocations.normalMatrix, false, this.normalMatrix);

    gl.drawArraysInstanced(gl.TRIANGLES, 0, this.positionBuffer.length, CUBE_COUNT);
  }
}
