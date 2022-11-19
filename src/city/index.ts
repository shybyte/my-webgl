import { mat4 } from 'gl-matrix';
import { renderLoop, setupCanvas } from '../my-utils';
import { CheckerBoard } from './checker-board';
import { Cubes } from './cubes';
import { MouseController } from './mouse-controller';
import { Skybox } from './skybox';
import { Picker } from './picking';
import {
  FRAGMENT_SHADER_BLUR_HORIZONTAL_SRC,
  FRAGMENT_SHADER_BLUR_VERTICAL_SRC,
  FRAGMENT_SHADER_BRIGHTEN_SRC,
  FRAGMENT_SHADER_COPY_SRC,
  FrameBufferRenderer,
} from './post-effects/frame-buffer-renderer';
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
  const finalViewMatrix = mat4.create();

  const picker = new Picker(gl);
  const checkerBoard = new CheckerBoard(gl);
  const cubes = new Cubes(gl);
  const mouseController = new MouseController(canvas);
  const skybox = new Skybox(gl);

  const frameBuffer = new FrameBuffer(gl, true);
  const frameBuffer2 = new FrameBuffer(gl, false);
  const frameBuffer3 = new FrameBuffer(gl, false);
  const copyFrameBufferRenderer = new FrameBufferRenderer(gl, FRAGMENT_SHADER_COPY_SRC);
  const brightenFrameBufferRenderer = new FrameBufferRenderer(gl, FRAGMENT_SHADER_BRIGHTEN_SRC);
  const blurHorizontalFrameBufferRenderer = new FrameBufferRenderer(gl, FRAGMENT_SHADER_BLUR_HORIZONTAL_SRC);
  const blurVerticalFrameBufferRenderer = new FrameBufferRenderer(gl, FRAGMENT_SHADER_BLUR_VERTICAL_SRC);

  renderLoop((_deltaTime, fps, frameCount) => {
    if (frameCount % 10 === 5) {
      infoDisplayElement.textContent = 'FPS: ' + fps;
    }

    mouseController.onRenderLoop();

    mat4.copy(finalViewMatrix, viewMatrix);
    mat4.translate(finalViewMatrix, finalViewMatrix, [mouseController.moveX, 0.0, mouseController.moveY]);
    mat4.rotateX(finalViewMatrix, finalViewMatrix, mouseController.phi);
    mat4.rotateY(finalViewMatrix, finalViewMatrix, mouseController.theta);
    mat4.scale(finalViewMatrix, finalViewMatrix, [mouseController.zoom, mouseController.zoom, mouseController.zoom]);

    const pickedId = picker.render(mouseX, mouseY, perspectiveSettings, (singlePixelProjectionMatrix) => {
      cubes.renderPicking(gl, finalViewMatrix, singlePixelProjectionMatrix);
    });
    cubes.setSelectedInstanceId(pickedId);

    frameBuffer.bind(() => {
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      checkerBoard.render(gl, finalViewMatrix, projectionMatrix);
      cubes.render(gl, finalViewMatrix, projectionMatrix);
      skybox.render(gl, finalViewMatrix, projectionMatrix);
    });

    frameBuffer2.bind(() => {
      copyFrameBufferRenderer.render(frameBuffer);
    });

    for (let i = 0; i < 1; i++) {
      frameBuffer3.bind(() => {
        blurHorizontalFrameBufferRenderer.render(frameBuffer2);
      });
      frameBuffer2.bind(() => {
        blurVerticalFrameBufferRenderer.render(frameBuffer3);
      });
    }
    brightenFrameBufferRenderer.render(frameBuffer2);
  });

  console.log('Starting main finished.');
}

main();
