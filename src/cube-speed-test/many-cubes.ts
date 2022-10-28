import { mat4 } from 'gl-matrix';
import {
  createMyBuffer,
  createProgram,
  randomColor,
  renderLoop,
  setProgramAttributeToMyBuffer,
  setupCanvas,
} from '../my-utils';

export function main() {
  console.log('Starting main...');
  const { infoDisplayElement, gl, canvas } = setupCanvas();

  // prettier-ignore
  const vertexData = [
    // Front
    0.5, 0.5, 0.5, // top right
    0.5, -.5, 0.5, // bottom right
    -.5, 0.5, 0.5, // top left
    -.5, 0.5, 0.5, // top left
    0.5, -.5, 0.5, // bottom right
    -.5, -.5, 0.5, // bottom left

    // Left
    -.5, 0.5, 0.5,
    -.5, -.5, 0.5,
    -.5, 0.5, -.5,
    -.5, 0.5, -.5,
    -.5, -.5, 0.5,
    -.5, -.5, -.5,

    // Back
    -.5, 0.5, -.5,
    -.5, -.5, -.5,
    0.5, 0.5, -.5,
    0.5, 0.5, -.5,
    -.5, -.5, -.5,
    0.5, -.5, -.5,

    0.5, 0.5, -.5,
    0.5, -.5, -.5,
    0.5, 0.5, 0.5,
    0.5, 0.5, 0.5,
    0.5, -.5, -0.5,
    0.5, -.5, 0.5,

    // Top
    0.5, 0.5, 0.5,
    0.5, 0.5, -.5,
    -.5, 0.5, 0.5,
    -.5, 0.5, 0.5,
    0.5, 0.5, -.5,
    -.5, 0.5, -.5,

    // Underside
    0.5, -.5, 0.5,
    0.5, -.5, -.5,
    -.5, -.5, 0.5,
    -.5, -.5, 0.5,
    0.5, -.5, -.5,
    -.5, -.5, -.5,
  ];

  const colorData = [];
  for (let face = 0; face < 6; face++) {
    let faceColor = randomColor();
    for (let vertex = 0; vertex < 6; vertex++) {
      colorData.push(...faceColor);
    }
  }

  const positionBuffer = createMyBuffer(gl, vertexData);
  const colorBuffer = createMyBuffer(gl, colorData);

  // language=glsl
  const program = createProgram(
    gl,
    `#version 300 es
    precision mediump float;

    in vec3 position;
    in vec3 color;
    out vec3 vColor;

    uniform mat4 matrix;

    void main() {
      vColor = color;
      gl_Position = matrix * vec4(position, 1);
    }
    `,
    `#version 300 es
    precision mediump float;

    in vec3 vColor;
    out vec4 finalColor;


    void main() {
      finalColor = vec4(vColor, 1);
    }
    `,
  );

  gl.useProgram(program);
  gl.enable(gl.DEPTH_TEST);

  setProgramAttributeToMyBuffer(gl, program, 'position', positionBuffer);
  setProgramAttributeToMyBuffer(gl, program, 'color', colorBuffer);

  const uniformLocations = {
    matrix: gl.getUniformLocation(program, 'matrix'),
  };

  const modelMatrix = mat4.create();
  mat4.translate(modelMatrix, modelMatrix, [0, 0, 0]);

  const projectionMatrix = mat4.create();
  mat4.perspective(
    projectionMatrix,
    (75 * Math.PI) / 180, //vertical field of view (angle, radians)
    canvas.width / canvas.height, // apsect ratio W/H
    1e-4, // near cull distance
    1e4, // far cull distance
  );

  const viewMatrix = mat4.create();
  mat4.translate(viewMatrix, viewMatrix, [0, 0, 2]);
  mat4.invert(viewMatrix, viewMatrix);

  const mvMatrix = mat4.create();
  const finalMatrix = mat4.create();

  renderLoop((deltaTime, fps, frameCount) => {
    if (frameCount % 10 === 5) {
      infoDisplayElement.innerText = 'FPS: ' + fps;
    }

    mat4.rotateZ(modelMatrix, modelMatrix, 0.6 * deltaTime);
    mat4.rotateX(modelMatrix, modelMatrix, 0.7 * deltaTime);

    mat4.multiply(mvMatrix, viewMatrix, modelMatrix);
    mat4.multiply(finalMatrix, projectionMatrix, mvMatrix);
    gl.uniformMatrix4fv(uniformLocations.matrix, false, finalMatrix);

    gl.drawArrays(gl.TRIANGLES, 0, positionBuffer.length);
  });

  console.log('Starting main finished.');
}

main();
