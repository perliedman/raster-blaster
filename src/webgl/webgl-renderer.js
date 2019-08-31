import Renderer from "..";

pipelineCache = {}

export default class WebGlRenderer extends Renderer {
  static isSupported() {
    return create3DContext(document.createElement('canvas')) !== null;
  }

  constructor (options) {
    super(options)

    this.canvas = document.createElement('canvas')
    this.canvas.width = this.options.width
    this.canvas.height = this.options.height
    this.gl = create3dContext(canvas)
  }

  async render (canvas, pipeline, source) {
    const { gl } = this

    let webGlPipeline = pipelineCache[pipeline.id]
    if (!webGlPipeline) {
      pipelineCache[pipeline.id] = webGlPipeline = new WebGlPipeline(gl, pipeline)
    }

    const { width, height, maxValue } = this.options
    const { program } = webGlPipeline

    gl.clear(this.gl.DEPTH_BUFFER_BIT | this.gl.COLOR_BUFFER_BIT);
    gl.useProgram(program)
    gl.viewport(0, 0, width, height)

    const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');

    // provide texture coordinates for the rectangle.
    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0.0, 0.0,
      1.0, 0.0,
      0.0, 1.0,
      0.0, 1.0,
      1.0, 0.0,
      1.0, 1.0]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

    gl.uniform1f(gl.getUniformLocation(program, 'u_maxValue'), maxValue);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const matrixLocation = gl.getUniformLocation(program, 'u_matrix');

    gl.uniform2f(resolutionLocation, width, height);
    const matrix = [
      1, 0, 0,
      0, 1, 0,
      0, 0, 1,
    ];
    gl.uniformMatrix3fv(matrixLocation, false, matrix);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    setRectangle(gl, 0, 0, width, height);

    webGlPipeline.bindTextures()
    webGlPipeline.bindUniforms()

    gl.viewport(0, 0, width, height);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
}

function create3dContext(canvas) {
  const names = ['webgl', 'experimental-webgl'];
  let context = null;
  for (let i = 0; i < names.length; ++i) {
    try {
      context = canvas.getContext(names[i]);
    } catch (e) { }  // eslint-disable-line
    if (context) {
      break;
    }
  }
  if (!context || !context.getExtension('OES_texture_float')) {
    return null;
  }

  return context;
}