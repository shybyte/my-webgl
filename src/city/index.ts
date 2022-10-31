import { mat4 } from 'gl-matrix';
import { renderLoop, setupCanvas } from '../my-utils';
import { CheckerBoard } from './checker-board';

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

  const viewMatrix = mat4.lookAt(mat4.create(), [0, 1, 5], [0, 0, 0], [0, 1, 0]);

  const checkerBoard = new CheckerBoard(gl);

  renderLoop((deltaTime, fps, frameCount) => {
    if (frameCount % 10 === 5) {
      infoDisplayElement.innerText = 'FPS: ' + fps;
    }

    mat4.rotateY(viewMatrix, viewMatrix, 0.2 * deltaTime);
    checkerBoard.render(gl, viewMatrix, projectionMatrix);
  });

  console.log('Starting main finished.');
}

main();
