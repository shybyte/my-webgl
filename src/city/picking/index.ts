import { mat4 } from 'gl-matrix';
import { FrameBuffer } from '../utils/frame-buffer';

export class Picker {
  private readonly frameBuffer: FrameBuffer;
  private readonly pixelData = new Uint8Array(4);
  private readonly singlePixelProjectionMatrix = mat4.create();

  constructor(private gl: WebGL2RenderingContext) {
    this.frameBuffer = new FrameBuffer(gl, 1, 1);
  }

  render(
    mouseX: number,
    mouseY: number,
    perspective: PerspectiveSettings,
    renderObjects: (singlePixelProjectionMatrix: mat4) => void,
  ): number {
    const gl = this.gl;

    const id = this.frameBuffer.bind(() => {
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      create1PixelProjectionMatrix(mouseX, mouseY, perspective, gl, this.singlePixelProjectionMatrix);
      renderObjects(this.singlePixelProjectionMatrix);

      gl.readPixels(
        0, // x
        0, // y
        1, // width
        1, // height
        gl.RGBA, // format
        gl.UNSIGNED_BYTE, // type
        this.pixelData,
      ); // typed array to hold result

      return this.pixelData[0] + (this.pixelData[1] << 8) + (this.pixelData[2] << 16);
    });

    if (id) {
      return id - 1;
    } else {
      return -1;
    }
  }
}

export interface PerspectiveSettings {
  fieldOfViewRadians: number;
  near: number;
  far: number;
}

function create1PixelProjectionMatrix(
  mouseX: number,
  mouseY: number,
  perspective: PerspectiveSettings,
  gl: WebGL2RenderingContext,
  output: mat4,
) {
  // compute the rectangle the near plane of our frustum covers
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const top = Math.tan(perspective.fieldOfViewRadians * 0.5) * perspective.near;
  const bottom = -top;
  const left = aspect * bottom;
  const right = aspect * top;
  const width = Math.abs(right - left);
  const height = Math.abs(top - bottom);

  // compute the portion of the near plane covers the 1 pixel
  // under the mouse.
  const pixelX = (mouseX * gl.canvas.width) / gl.canvas.clientWidth;
  const pixelY = gl.canvas.height - (mouseY * gl.canvas.height) / gl.canvas.clientHeight - 1;

  const subLeft = left + (pixelX * width) / gl.canvas.width;
  const subBottom = bottom + (pixelY * height) / gl.canvas.height;
  const subWidth = width / gl.canvas.width;
  const subHeight = height / gl.canvas.height;

  // make a frustum for that 1 pixel
  mat4.frustum(
    output,
    subLeft,
    subLeft + subWidth,
    subBottom,
    subBottom + subHeight,
    perspective.near,
    perspective.far,
  );
}
