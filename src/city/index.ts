import { mat4 } from 'gl-matrix';
import { renderLoop, setupCanvas } from '../my-utils';
import { CheckerBoard } from './checker-board';
import { Cubes } from './cubes';
import { MouseController } from './mouse-controller';
import { Skybox } from './skybox';

export function main() {
  console.log('Starting main...');
  const { infoDisplayElement, gl, canvas } = setupCanvas();

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);

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

    checkerBoard.render(gl, viewMatrixRotated, projectionMatrix);
    cubes.render(gl, viewMatrixRotated, projectionMatrix);
    skybox.render(gl, viewMatrixRotated, projectionMatrix);
  });

  console.log('Starting main finished.');
}

main();
