export class FrameBuffer {
  private readonly frameBuffer: WebGLFramebuffer;
  public readonly targetTexture: WebGLTexture;

  constructor(
    private gl: WebGL2RenderingContext,
    createDepthBuffer: boolean,
    width = gl.canvas.width,
    height = gl.canvas.height,
  ) {
    // Create a texture to render to
    this.targetTexture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.targetTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // create a depth renderbuffer
    const depthBuffer = createDepthBuffer && gl.createRenderbuffer();
    if (createDepthBuffer && !depthBuffer) {
      throw new Error('Can not createRenderbuffer');
    }

    if (createDepthBuffer) {
      gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
    }

    const setFramebufferAttachmentSizes = (width: number, height: number) => {
      gl.bindTexture(gl.TEXTURE_2D, this.targetTexture);
      // define size and format of level 0
      const level = 0;
      const internalFormat = gl.RGBA;
      const border = 0;
      const format = gl.RGBA;
      const type = gl.UNSIGNED_BYTE;
      const data = null;
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, format, type, data);

      if (createDepthBuffer) {
        gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, width, height);
      }
    };

    // Create and bind the framebuffer
    const fb = gl.createFramebuffer();
    if (!fb) {
      throw new Error('Can not createFramebuffer');
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

    // attach the texture as the first color attachment
    const attachmentPoint = gl.COLOR_ATTACHMENT0;
    const level = 0;
    gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, this.targetTexture, level);

    // make a depth buffer and the same size as the targetTexture
    if (createDepthBuffer) {
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
    }

    setFramebufferAttachmentSizes(width, height);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    this.frameBuffer = fb;
  }

  bind<T>(callback: () => T): T {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.frameBuffer);
    const result = callback();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    return result;
  }
}
