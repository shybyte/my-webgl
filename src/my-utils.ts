export function setupCanvas() {
  const infoDisplayElement = document.querySelector<HTMLDivElement>('#infoDisplay')!;

  const canvas = document.querySelector<HTMLCanvasElement>('canvas')!;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const gl = canvas.getContext('webgl2')!;

  if (!gl) {
    throw new Error('WebG 2 is not supported');
  }

  return { infoDisplayElement, canvas, gl };
}

function createShader(gl: WebGL2RenderingContext, src: string, type: GLenum) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const shaderInfoLog = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error('Error compiling shader : ' + shaderInfoLog);
  }

  return shader;
}

export function createProgram(
  gl: WebGL2RenderingContext,
  vertexShaderSrc: string,
  fragmentShaderSrc: string,
): WebGLProgram {
  const vertexShader = createShader(gl, vertexShaderSrc, gl.VERTEX_SHADER)!;
  const fragmentShader = createShader(gl, fragmentShaderSrc, gl.FRAGMENT_SHADER)!;

  const program = gl.createProgram()!;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  //Check if successful
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const programInfoLog = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error('Error creating shader program.' + programInfoLog);
  }

  //Only do this for additional debugging.
  gl.validateProgram(program);
  if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
    const programInfoLog = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error('Error creating shader program.' + programInfoLog);
  }

  // Can delete the shaders since the program has been made.
  // Is this really needed?
  gl.detachShader(program, vertexShader); // detaching might cause issues on some browsers, Might only need to delete.
  gl.detachShader(program, fragmentShader);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  return program;
}

interface MyBuffer {
  length: number;
  size: number;
  webglBuffer: WebGLBuffer;
}

export function createBuffer(gl: WebGL2RenderingContext, data: number[]): WebGLBuffer {
  const buffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  return buffer;
}

export function createMyBuffer(gl: WebGL2RenderingContext, data: number[], size = 3): MyBuffer {
  if (data.length % size !== 0) {
    throw new Error('buffer length must be divisible by ' + size);
  }
  return {
    size: size,
    length: data.length / size,
    webglBuffer: createBuffer(gl, data),
  };
}

export function setProgramAttributeToMyBuffer(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  attributeName: string,
  myBuffer: MyBuffer,
) {
  const location = gl.getAttribLocation(program, attributeName);
  gl.enableVertexAttribArray(location);
  gl.bindBuffer(gl.ARRAY_BUFFER, myBuffer.webglBuffer);
  gl.vertexAttribPointer(location, myBuffer.size, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

export function loadTexture(gl: WebGL2RenderingContext, url: string) {
  const texture = gl.createTexture();
  const image = new Image();

  image.onload = (_e) => {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
  };

  image.src = url;
  return texture;
}

export function loadAndBindTexture(gl: WebGL2RenderingContext, url: string, textureID: number) {
  const brick = loadTexture(gl, url);
  gl.activeTexture(gl.TEXTURE0 + textureID);
  gl.bindTexture(gl.TEXTURE_2D, brick);
}

// Construct an Array by repeating `pattern` n times
export function repeat<T>(n: number, pattern: T | T[]): T[] {
  return [...Array(n)].reduce((sum) => sum.concat(pattern), []);
}

export function renderLoop(callback: (deltaTime: number, fps: number, frameCount: number) => void) {
  let msLastFrame: number;
  let frameCount = 0;
  let lastFps: number;

  function animate() {
    requestAnimationFrame(animate);

    const msCurrent = performance.now();
    const deltaTime = msLastFrame ? (msCurrent - msLastFrame) / 1000.0 : 1;
    const fps = lastFps ? (Math.floor(1 / deltaTime) + lastFps * 49) / 50 : Math.floor(1 / deltaTime);
    msLastFrame = msCurrent;
    lastFps = fps;

    callback(deltaTime, Math.ceil(fps), frameCount);
    frameCount += 1;
  }

  animate();
}

export function randomColor() {
  return [Math.random(), Math.random(), Math.random()];
}

export function scaleVertexData(data: number[], vec3: [number, number, number]): number[] {
  for (let i = 0; i < data.length; i++) {
    data[i] = data[i] * vec3[i % 3];
  }
  return data;
}
