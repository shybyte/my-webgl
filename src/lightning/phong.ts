import { mat4 } from 'gl-matrix';
import {
  createMyBuffer,
  createProgram,
  randomColor,
  renderLoop,
  setProgramAttributeToMyBuffer,
  setupCanvas,
} from '../my-utils';
import { cubeNormalData, cubeVertexData } from './cube';
import { fragmentShader, vertexShaderSrc } from './shader';

const CUBE_COUNT = 1;

export function main() {
  console.log('Starting main...');
  const { infoDisplayElement, gl, canvas } = setupCanvas();

  const offsetData = [];
  const cubeCloudSize = 0;
  for (let i = 0; i < CUBE_COUNT; i++) {
    offsetData.push(
      (Math.random() - 0.5) * cubeCloudSize,
      (Math.random() - 0.5) * cubeCloudSize,
      (Math.random() - 0.5) * cubeCloudSize,
    );
  }

  const colorData = [1, 0, 0];
  for (let i = 0; i < CUBE_COUNT - 1; i++) {
    colorData.push(...randomColor());
  }

  const positionBuffer = createMyBuffer(gl, cubeVertexData);
  const normalBuffer = createMyBuffer(gl, cubeNormalData);

  const offsetBuffer = createMyBuffer(gl, offsetData);
  const colorBuffer = createMyBuffer(gl, colorData);

  const program = createProgram(gl, vertexShaderSrc, fragmentShader);
  gl.useProgram(program);
  gl.enable(gl.DEPTH_TEST);

  setProgramAttributeToMyBuffer(gl, program, 'position', positionBuffer);
  setProgramAttributeToMyBuffer(gl, program, 'aOffset', offsetBuffer);
  setProgramAttributeToMyBuffer(gl, program, 'color', colorBuffer);
  setProgramAttributeToMyBuffer(gl, program, 'normal', normalBuffer);

  const offsetLocation = gl.getAttribLocation(program, 'aOffset');
  const colorLocation = gl.getAttribLocation(program, 'color');
  gl.vertexAttribDivisor(offsetLocation, 1);
  gl.vertexAttribDivisor(colorLocation, 1);

  const uniformLocations = {
    normalMatrix: gl.getUniformLocation(program, `normalMatrix`),
    projection: gl.getUniformLocation(program, 'projection'),
    modelview: gl.getUniformLocation(program, `modelview`),
  };

  const projectionMatrix = mat4.create();
  mat4.perspective(
    projectionMatrix,
    (75 * Math.PI) / 180, //vertical field of view (angle, radians)
    canvas.width / canvas.height, // apsect ratio W/H
    1e-4, // near cull distance
    1e4, // far cull distance
  );

  const viewMatrix = mat4.lookAt(mat4.create(), [0, 0, 2], [0, 0, 0], [0, 1, 0]);

  const modelMatrix = mat4.create();
  const mvMatrix = mat4.create();
  const normalMatrix = mat4.create();

  gl.enable(gl.CULL_FACE);

  renderLoop((deltaTime, fps, frameCount) => {
    if (frameCount % 10 === 5) {
      infoDisplayElement.innerText = 'FPS: ' + fps;
    }

    mat4.rotateZ(modelMatrix, modelMatrix, 0.6 * deltaTime);
    mat4.rotateX(modelMatrix, modelMatrix, 0.7 * deltaTime);
    mat4.rotateY(modelMatrix, modelMatrix, 0.8 * deltaTime);

    mat4.multiply(mvMatrix, viewMatrix, modelMatrix);
    mat4.invert(normalMatrix, mvMatrix);
    mat4.transpose(normalMatrix, normalMatrix);

    gl.uniformMatrix4fv(uniformLocations.projection, false, projectionMatrix);
    gl.uniformMatrix4fv(uniformLocations.modelview, false, mvMatrix);
    gl.uniformMatrix4fv(uniformLocations.normalMatrix, false, normalMatrix);

    gl.drawArraysInstanced(gl.TRIANGLES, 0, positionBuffer.length, CUBE_COUNT);
  });

  console.log('Starting main finished.');
}

main();
