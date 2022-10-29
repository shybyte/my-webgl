import { mat4 } from 'gl-matrix';
import {
  createMyBuffer,
  createProgram,
  randomColor,
  renderLoop,
  setProgramAttributeToMyBuffer,
  setupCanvas,
  repeat,
} from '../my-utils';

const CUBE_COUNT = 1;

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

  const offsetData = [];
  for (let i = 0; i < CUBE_COUNT; i++) {
    // offsetData.push((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20);
    offsetData.push(0, 0, 0);
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

  const normalData = [
    ...repeat(6, [0, 0, 1]), // Z+
    ...repeat(6, [-1, 0, 0]), // X-
    ...repeat(6, [0, 0, -1]), // Z-
    ...repeat(6, [1, 0, 0]), // X+
    ...repeat(6, [0, 1, 0]), // Y+
    ...repeat(6, [0, -1, 0]), // Y-
  ];
  const normalBuffer = createMyBuffer(gl, normalData, 3);

  const positionBuffer = createMyBuffer(gl, vertexDataCube);
  const offsetBuffer = createMyBuffer(gl, offsetData);
  const colorBuffer = createMyBuffer(gl, colorData);

  // language=glsl
  const program = createProgram(
    gl,
    `#version 300 es
    precision mediump float;

    const vec3 lightDirection = normalize(vec3(0, -2, 2));
    const float ambient = 0.1;

    in vec3 position;
    in vec3 color;
    in vec3 aOffset;
    in vec3 normal;

    out vec3 vColor;
    out float vBrightness;

    uniform mat4 matrix;
    uniform mat4 normalMatrix;


    void main() {
      vColor = color;
      vec3 worldNormal = (normalMatrix * vec4(normal, 1)).xyz;
      float diffuse = max(0.0, dot(worldNormal, lightDirection));
      vBrightness = ambient + diffuse;
      gl_Position = matrix * vec4(position + aOffset, 1);
    }
    `,
    `#version 300 es
    precision mediump float;

    in vec3 vColor;
    in float vBrightness;
    out vec4 finalColor;

    void main() {
      finalColor = vec4(vColor * vBrightness, 1);
    }
    `,
  );

  gl.useProgram(program);
  gl.enable(gl.DEPTH_TEST);

  setProgramAttributeToMyBuffer(gl, program, 'position', positionBuffer);
  setProgramAttributeToMyBuffer(gl, program, 'aOffset', offsetBuffer);
  setProgramAttributeToMyBuffer(gl, program, 'color', colorBuffer);
  setProgramAttributeToMyBuffer(gl, program, 'normal', normalBuffer);

  const offsetLocation = gl.getAttribLocation(program, 'aOffset');
  gl.vertexAttribDivisor(offsetLocation, 1);

  const uniformLocations = {
    matrix: gl.getUniformLocation(program, 'matrix'),
    normalMatrix: gl.getUniformLocation(program, `normalMatrix`),
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

  const viewMatrix = mat4.lookAt(mat4.create(), [0, 0, 3], [0, 0, 0], [0, 1, 0]);
  const mvMatrix = mat4.create();
  const finalMatrix = mat4.create();
  const normalMatrix = mat4.create();

  gl.enable(gl.CULL_FACE);

  renderLoop((deltaTime, fps, frameCount) => {
    if (frameCount % 10 === 5) {
      infoDisplayElement.innerText = 'FPS: ' + fps;
    }

    mat4.rotateZ(modelMatrix, modelMatrix, 0.6 * deltaTime);
    mat4.rotateX(modelMatrix, modelMatrix, 0.7 * deltaTime);
    mat4.rotateY(modelMatrix, modelMatrix, 0.7 * deltaTime);

    mat4.multiply(mvMatrix, viewMatrix, modelMatrix);

    mat4.invert(normalMatrix, mvMatrix);
    mat4.transpose(normalMatrix, normalMatrix);

    mat4.multiply(finalMatrix, projectionMatrix, mvMatrix);
    gl.uniformMatrix4fv(uniformLocations.matrix, false, finalMatrix);
    gl.uniformMatrix4fv(uniformLocations.normalMatrix, false, normalMatrix);

    gl.drawArraysInstanced(gl.TRIANGLES, 0, positionBuffer.length, CUBE_COUNT);
  });

  console.log('Starting main finished.');
}

main();
