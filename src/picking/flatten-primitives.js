import * as twgl from 'twgl.js';

// this function takes a set of indexed vertices
// It deindexed them. It then adds random vertex
// colors to each triangle. Finally it passes
// the result to createBufferInfoFromArrays and
// returns a twgl.BufferInfo
function createFlattenedVertices(gl, vertices, vertsPerColor) {
  let last;
  return twgl.createBufferInfoFromArrays(
    gl,
    twgl.primitives.makeRandomVertexColors(twgl.primitives.deindexVertices(vertices), {
      vertsPerColor: vertsPerColor || 1,
      rand: function (ndx, channel) {
        if (channel === 0) {
          last = (128 + Math.random() * 128) | 0;
        }
        return channel < 3 ? last : 255;
      },
    }),
  );
}

function createFlattenedFunc(createVerticesFunc, vertsPerColor) {
  return function (gl) {
    const arrays = createVerticesFunc.apply(null, Array.prototype.slice.call(arguments, 1));
    return createFlattenedVertices(gl, arrays, vertsPerColor);
  };
}

// These functions make primitives with semi-random vertex colors.
// This means the primitives can be displayed without needing lighting
// which is important to keep the samples simple.

const create3DFBufferInfo = createFlattenedFunc(twgl.primitives.create3DFVertices, 6);
export const createCubeBufferInfo = createFlattenedFunc(twgl.primitives.createCubeVertices, 6);
export const createPlaneBufferInfo = createFlattenedFunc(twgl.primitives.createPlaneVertices, 6);
export const createSphereBufferInfo = createFlattenedFunc(twgl.primitives.createSphereVertices, 6);
export const createTruncatedConeBufferInfo = createFlattenedFunc(twgl.primitives.createTruncatedConeVertices, 6);
export const createXYQuadBufferInfo = createFlattenedFunc(twgl.primitives.createXYQuadVertices, 6);
export const createCresentBufferInfo = createFlattenedFunc(twgl.primitives.createCresentVertices, 6);
export const createCylinderBufferInfo = createFlattenedFunc(twgl.primitives.createCylinderVertices, 6);
export const createTorusBufferInfo = createFlattenedFunc(twgl.primitives.createTorusVertices, 6);
export const createDiscBufferInfo = createFlattenedFunc(twgl.primitives.createDiscVertices, 4);
