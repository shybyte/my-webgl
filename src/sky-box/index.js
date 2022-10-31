import { m4 } from 'twgl.js';
import { setupCanvas, createProgram } from '../my-utils';

const vertexShaderSource = `#version 300 es
in vec4 a_position;
out vec4 v_position;
void main() {
  v_position = a_position;
  gl_Position = a_position;
  gl_Position.z = 1.0;
}
`;

const fragmentShaderSource = `#version 300 es
precision highp float;

uniform samplerCube u_skybox;
uniform mat4 u_viewDirectionProjectionInverse;

in vec4 v_position;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
  vec4 t = u_viewDirectionProjectionInverse * v_position;
  outColor = texture(u_skybox, normalize(t.xyz / t.w));
}
`;

function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */

  const { infoDisplayElement, gl, canvas } = setupCanvas();

  /*========================= CAPTURE MOUSE EVENTS ========================= */

  var THETA = 0,
    PHI = 0;
  var AMORTIZATION = 0.95;
  var drag = false;
  var x_prev, y_prev;
  var dX = 0,
    dY = 0;

  var mouseDown = function (e) {
    drag = true;
    (x_prev = e.pageX), (y_prev = e.pageY);
    e.preventDefault();
    return false;
  };

  var mouseUp = function (e) {
    drag = false;
  };

  var mouseMove = function (e) {
    if (!drag) return false;
    (dX = ((e.pageX - x_prev) * Math.PI) / canvas.width), (dY = ((e.pageY - y_prev) * Math.PI) / canvas.height);
    THETA += dX;
    PHI += dY;
    (x_prev = e.pageX), (y_prev = e.pageY);
    console.log('THETA:', THETA, PHI);
    e.preventDefault();
  };

  canvas.addEventListener('mousedown', mouseDown, false);
  canvas.addEventListener('mouseup', mouseUp, false);
  canvas.addEventListener('mouseout', mouseUp, false);
  canvas.addEventListener('mousemove', mouseMove, false);

  /*========================= END MOUSE EVENTS ========================= */

  // Use our boilerplate utils to compile the shaders and link into a program
  var program = createProgram(gl, vertexShaderSource, fragmentShaderSource);

  // look up where the vertex data needs to go.
  var positionLocation = gl.getAttribLocation(program, 'a_position');

  // lookup uniforms
  var skyboxLocation = gl.getUniformLocation(program, 'u_skybox');
  var viewDirectionProjectionInverseLocation = gl.getUniformLocation(program, 'u_viewDirectionProjectionInverse');

  // Create a vertex array object (attribute state)
  var vao = gl.createVertexArray();

  // and make it the one we're currently working with
  gl.bindVertexArray(vao);

  // Create a buffer for positions
  var positionBuffer = gl.createBuffer();
  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  // Put the positions in the buffer
  setGeometry(gl);

  // Turn on the position attribute
  gl.enableVertexAttribArray(positionLocation);

  // Bind the position buffer.
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  var size = 2; // 2 components per iteration
  var type = gl.FLOAT; // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0; // start at the beginning of the buffer
  gl.vertexAttribPointer(positionLocation, size, type, normalize, stride, offset);

  // Create a texture.
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

  const faceInfos = [
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
      url: './skybox-images/pos-x.jpg',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
      url: './skybox-images/neg-x.jpg',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
      url: './skybox-images/pos-y.jpg',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
      url: './skybox-images/neg-y.jpg',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
      url: './skybox-images/pos-z.jpg',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
      url: './skybox-images/neg-z.jpg',
    },
  ];
  faceInfos.forEach((faceInfo) => {
    const { target, url } = faceInfo;

    // Upload the canvas to the cubemap face.
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 512;
    const height = 512;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;

    // setup each face so it's immediately renderable
    gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);

    // Asynchronously load an image
    const image = new Image();
    image.src = url;
    image.addEventListener('load', function () {
      // Now that the image has loaded make copy it to the texture.
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
      gl.texImage2D(target, level, internalFormat, format, type, image);
      gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    });
  });
  gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

  function degToRad(d) {
    return (d * Math.PI) / 180;
  }

  var fieldOfViewRadians = degToRad(60);

  requestAnimationFrame(drawScene);

  // Draw the scene.
  function drawScene(time) {
    if (!drag) {
      (dX *= AMORTIZATION), (dY *= AMORTIZATION);
      (THETA += dX), (PHI += dY);
    }

    // convert to seconds
    time *= 0.001;

    // Tell WebGL how to convert from clip space to pixels

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    // Clear the canvas AND the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    // Bind the attribute/buffer set we want.
    gl.bindVertexArray(vao);

    // Compute the projection matrix
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

    // camera going in circle 2 units from origin looking at origin
    var cameraPosition = [Math.cos(THETA), Math.sin(PHI), Math.sin(THETA)];
    var target = [0, 0, 0];
    var up = [0, 1, 0];
    // Compute the camera's matrix using look at.
    var cameraMatrix = m4.lookAt(cameraPosition, target, up);

    // Make a view matrix from the camera matrix.
    var viewMatrix = m4.inverse(cameraMatrix);

    // We only care about direciton so remove the translation
    viewMatrix[12] = 0;
    viewMatrix[13] = 0;
    viewMatrix[14] = 0;

    var viewDirectionProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);
    var viewDirectionProjectionInverseMatrix = m4.inverse(viewDirectionProjectionMatrix);

    // Set the uniforms
    gl.uniformMatrix4fv(viewDirectionProjectionInverseLocation, false, viewDirectionProjectionInverseMatrix);

    // Tell the shader to use texture unit 0 for u_skybox
    gl.uniform1i(skyboxLocation, 0);

    // let our quad pass the depth test at 1.0
    gl.depthFunc(gl.LEQUAL);

    // Draw the geometry.
    gl.drawArrays(gl.TRIANGLES, 0, 1 * 6);

    requestAnimationFrame(drawScene);
  }
}

// Fill the buffer with the values that define a quad.
function setGeometry(gl) {
  var positions = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
}

main();
