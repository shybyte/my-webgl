import { mat4 } from 'gl-matrix';
import { renderLoop, setupCanvas } from '../my-utils';
import { CheckerBoard } from './checker-board';
import { Cubes } from './cubes';
import { MouseController } from './mouse-controller';
import { Skybox } from './skybox';
import { setupPicking } from './picking';

export function main() {
  console.log('Starting main...');
  const { infoDisplayElement, gl, canvas } = setupCanvas();

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);

  const pickingRenderBuffer = setupPicking(gl);

  let mouseX = 0;
  let mouseY = 0;

  gl.canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  });

  const projectionMatrix = mat4.create();
  mat4.perspective(
    projectionMatrix,
    (75 * Math.PI) / 180, //vertical field of view (angle, radians)
    canvas.width / canvas.height, // apsect ratio W/H
    1e-4, // near cull distance
    1e4, // far cull distance
  );

  const viewMatrix = mat4.lookAt(mat4.create(), [0, 2, 5], [0, 0, 0], [0, 1, 0]);
  const viewMatrixRotated = mat4.create();

  const checkerBoard = new CheckerBoard(gl);
  const cubes = new Cubes(gl);
  const mouseController = new MouseController(canvas);
  const skybox = new Skybox(gl);

  renderLoop((_deltaTime, fps, frameCount) => {
    if (frameCount % 10 === 5) {
      infoDisplayElement.innerText = 'FPS: ' + fps;
    }

    mouseController.onRenderLoop();

    mat4.rotateX(viewMatrixRotated, viewMatrix, mouseController.phi);
    mat4.rotateY(viewMatrixRotated, viewMatrixRotated, mouseController.theta);

    gl.bindFramebuffer(gl.FRAMEBUFFER, pickingRenderBuffer);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    cubes.renderPicking(gl, viewMatrixRotated, projectionMatrix);

    const pixelX = (mouseX * gl.canvas.width) / gl.canvas.clientWidth;
    const pixelY = gl.canvas.height - (mouseY * gl.canvas.height) / gl.canvas.clientHeight - 1;
    const data = new Uint8Array(4);
    gl.readPixels(
      pixelX, // x
      pixelY, // y
      1, // width
      1, // height
      gl.RGBA, // format
      gl.UNSIGNED_BYTE, // type
      data,
    ); // typed array to hold result
    const id = data[0] + (data[1] << 8) + (data[2] << 16);

    if (id) {
      cubes.setSelectedInstanceId(id - 1);
    } else {
      cubes.setSelectedInstanceId(-1);
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    checkerBoard.render(gl, viewMatrixRotated, projectionMatrix);
    cubes.render(gl, viewMatrixRotated, projectionMatrix);
    skybox.render(gl, viewMatrixRotated, projectionMatrix);
  });

  console.log('Starting main finished.');
}

main();
