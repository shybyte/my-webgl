import { mat4 } from 'gl-matrix';
import {
  createMyBuffer,
  createProgram,
  randomColor,
  renderLoop,
  setProgramAttributeToMyBuffer,
  setupCanvas,
} from '../my-utils';

const CUBE_COUNT = 1_000;

export function main() {
  console.log('Starting main...');
  const { infoDisplayElement, gl, canvas } = setupCanvas();

  // prettier-ignore
  const vertexDataCube = [
    // Front
    0.5, 0.5, 0.5, // top right
    -.5, 0.5, 0.5, // top left
    0.5, -.5, 0.5, // bottom right
    -.5, 0.5, 0.5, // top left
    -.5, -.5, 0.5, // bottom left
    0.5, -.5, 0.5, // bottom right

    // Left
    -.5, 0.5, 0.5,
    -.5, 0.5, -.5,
    -.5, -.5, 0.5,
    -.5, 0.5, -.5,
    -.5, -.5, -.5,
    -.5, -.5, 0.5,

    // Back
    -.5, 0.5, -.5,
    0.5, 0.5, -.5,
    -.5, -.5, -.5,
    0.5, 0.5, -.5,
    0.5, -.5, -.5,
    -.5, -.5, -.5,

    0.5, 0.5, -.5,
    0.5, 0.5, 0.5,
    0.5, -.5, -.5,
    0.5, 0.5, 0.5,
    0.5, -.5, 0.5,
    0.5, -.5, -0.5,

    // Top
    0.5, 0.5, 0.5,
    0.5, 0.5, -.5,
    -.5, 0.5, 0.5,
    -.5, 0.5, 0.5,
    0.5, 0.5, -.5,
    -.5, 0.5, -.5,

    // Underside
    0.5, -.5, 0.5,
    -.5, -.5, 0.5,
    0.5, -.5, -.5,
    -.5, -.5, 0.5,
    -.5, -.5, -.5,
    0.5, -.5, -.5,
  ];

  const vertexData = [];

  for (let i = 0; i < CUBE_COUNT; i++) {
    vertexData.push(
      ...moveVertexData(
        [...vertexDataCube],
        [(Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20],
      ),
    );
  }

  const colorDataCube = [];
  for (let face = 0; face < 6; face++) {
    let faceColor = randomColor();
    for (let vertex = 0; vertex < 6; vertex++) {
      colorDataCube.push(...faceColor);
    }
  }

  const colorData = [];
  for (let i = 0; i < CUBE_COUNT; i++) {
    colorData.push(...colorDataCube);
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

  const projectionMatrix = mat4.create();
  mat4.perspective(
    projectionMatrix,
    (75 * Math.PI) / 180, //vertical field of view (angle, radians)
    canvas.width / canvas.height, // apsect ratio W/H
    1e-4, // near cull distance
    1e4, // far cull distance
  );

  const viewMatrix = mat4.lookAt(mat4.create(), [0, 0, 30], [0, 0, 0], [0, 1, 0]);
  const mvMatrix = mat4.create();
  const finalMatrix = mat4.create();

  gl.enable(gl.CULL_FACE);

  renderLoop((deltaTime, fps, frameCount) => {
    if (frameCount % 10 === 5) {
      infoDisplayElement.innerText = 'FPS: ' + fps;
    }

    mat4.rotateZ(modelMatrix, modelMatrix, 0.6 * deltaTime);
    mat4.rotateX(modelMatrix, modelMatrix, 0.7 * deltaTime);
    mat4.rotateY(modelMatrix, modelMatrix, 0.7 * deltaTime);

    mat4.multiply(mvMatrix, viewMatrix, modelMatrix);
    mat4.multiply(finalMatrix, projectionMatrix, mvMatrix);
    gl.uniformMatrix4fv(uniformLocations.matrix, false, finalMatrix);

    gl.drawArrays(gl.TRIANGLES, 0, positionBuffer.length);
  });

  console.log('Starting main finished.');
}

function moveVertexData(data: number[], vec3: [number, number, number]): number[] {
  for (let i = 0; i < data.length; i++) {
    data[i] = data[i] + vec3[i % 3];
  }
  return data;
}

main();
