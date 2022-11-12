import { mat4 } from 'gl-matrix';
import { renderLoop, setupCanvas } from '../my-utils';
import { CheckerBoard } from './checker-board';
import { Cubes } from './cubes';
import { MouseController } from './mouse-controller';
import { Skybox } from './skybox';
import { Picker } from './picking';
import { FrameBufferRenderer } from './post-effects/frame-buffer-renderer';
import { FrameBuffer } from './utils/frame-buffer';

export function main() {
  console.log('Starting main...');
  const { infoDisplayElement, gl, canvas } = setupCanvas();

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);

  let mouseX = 0;
  let mouseY = 0;

  gl.canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  });

  const perspectiveSettings = {
    fieldOfViewRadians: (75 * Math.PI) / 180, //vertical field of view (angle, radians);
    near: 1e-4, // near cull distance
    far: 1e4, // far cull distance
  };

  const projectionMatrix = mat4.create();
  mat4.perspective(
    projectionMatrix,
    perspectiveSettings.fieldOfViewRadians,
    canvas.width / canvas.height, // apsect ratio W/H
    perspectiveSettings.near,
    perspectiveSettings.far,
  );

  const viewMatrix = mat4.lookAt(mat4.create(), [0, 2, 5], [0, 0, 0], [0, 1, 0]);
  const viewMatrixRotated = mat4.create();

  const picker = new Picker(gl);
  const checkerBoard = new CheckerBoard(gl);
  const cubes = new Cubes(gl);
  const mouseController = new MouseController(canvas);
  const skybox = new Skybox(gl);

  const frameBuffer = new FrameBuffer(gl);
  const frameBufferRenderer = new FrameBufferRenderer(gl);

  renderLoop((_deltaTime, fps, frameCount) => {
    if (frameCount % 10 === 5) {
      infoDisplayElement.textContent = 'FPS: ' + fps;
    }

    mouseController.onRenderLoop();

    mat4.rotateX(viewMatrixRotated, viewMatrix, mouseController.phi);
    mat4.rotateY(viewMatrixRotated, viewMatrixRotated, mouseController.theta);

    const pickedId = picker.render(mouseX, mouseY, perspectiveSettings, (singlePixelProjectionMatrix) => {
      cubes.renderPicking(gl, viewMatrixRotated, singlePixelProjectionMatrix);
    });
    cubes.setSelectedInstanceId(pickedId);

    frameBuffer.bind(() => {
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      checkerBoard.render(gl, viewMatrixRotated, projectionMatrix);
      cubes.render(gl, viewMatrixRotated, projectionMatrix);
      skybox.render(gl, viewMatrixRotated, projectionMatrix);
    });

    frameBufferRenderer.render(frameBuffer);
  });

  console.log('Starting main finished.');
}

main();
