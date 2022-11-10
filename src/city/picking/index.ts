import { mat4 } from 'gl-matrix';

export class Picker {
  private readonly frameBuffer: WebGLFramebuffer;
  private readonly pixelData = new Uint8Array(4);
  private readonly singlePixelProjectionMatrix = mat4.create();

  constructor(private gl: WebGL2RenderingContext) {
    // Create a texture to render to
    const targetTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, targetTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // create a depth renderbuffer
    const depthBuffer = gl.createRenderbuffer();
    if (!depthBuffer) {
      throw new Error('Can not createRenderbuffer');
    }

    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);

    function setFramebufferAttachmentSizes(width: number, height: number) {
      gl.bindTexture(gl.TEXTURE_2D, targetTexture);
      // define size and format of level 0
      const level = 0;
      const internalFormat = gl.RGBA;
      const border = 0;
      const format = gl.RGBA;
      const type = gl.UNSIGNED_BYTE;
      const data = null;
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, format, type, data);

      gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, width, height);
    }

    // Create and bind the framebuffer
    const fb = gl.createFramebuffer();
    if (!fb) {
      throw new Error('Can not createFramebuffer');
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

    // attach the texture as the first color attachment
    const attachmentPoint = gl.COLOR_ATTACHMENT0;
    const level = 0;
    gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, targetTexture, level);

    // make a depth buffer and the same size as the targetTexture
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

    setFramebufferAttachmentSizes(1, 1);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    this.frameBuffer = fb;
  }

  render(
    mouseX: number,
    mouseY: number,
    perspective: PerspectiveSettings,
    renderObjects: (singlePixelProjectionMatrix: mat4) => void,
  ): number {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
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
    const id = this.pixelData[0] + (this.pixelData[1] << 8) + (this.pixelData[2] << 16);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

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
