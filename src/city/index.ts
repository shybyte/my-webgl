import { mat4 } from 'gl-matrix';
import {
  createMyBuffer,
  createProgram,
  renderLoop,
  repeat,
  scaleVertexData,
  setProgramAttributeToMyBuffer,
  setupCanvas,
} from '../my-utils';
import { fragmentShader, vertexShaderSrc } from './shader';

export function main() {
  console.log('Starting main...');
  const { infoDisplayElement, gl, canvas } = setupCanvas();

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

  const positionBuffer = createMyBuffer(gl, vertexData);
  const normalBuffer = createMyBuffer(gl, normalData);

  const program = createProgram(gl, vertexShaderSrc, fragmentShader);
  gl.useProgram(program);
  gl.enable(gl.DEPTH_TEST);

  setProgramAttributeToMyBuffer(gl, program, 'position', positionBuffer);
  setProgramAttributeToMyBuffer(gl, program, 'normal', normalBuffer);

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

  const viewMatrix = mat4.lookAt(mat4.create(), [0, 1, 5], [0, 0, 0], [0, 1, 0]);

  const modelMatrix = mat4.create();
  const mvMatrix = mat4.create();
  const normalMatrix = mat4.create();

  gl.enable(gl.CULL_FACE);

  renderLoop((deltaTime, fps, frameCount) => {
    if (frameCount % 10 === 5) {
      infoDisplayElement.innerText = 'FPS: ' + fps;
    }

    mat4.rotateY(modelMatrix, modelMatrix, 0.2 * deltaTime);

    mat4.multiply(mvMatrix, viewMatrix, modelMatrix);
    mat4.invert(normalMatrix, mvMatrix);
    mat4.transpose(normalMatrix, normalMatrix);

    gl.uniformMatrix4fv(uniformLocations.projection, false, projectionMatrix);
    gl.uniformMatrix4fv(uniformLocations.modelview, false, mvMatrix);
    gl.uniformMatrix4fv(uniformLocations.normalMatrix, false, normalMatrix);

    gl.drawArrays(gl.TRIANGLES, 0, positionBuffer.length);
  });

  console.log('Starting main finished.');
}

main();
