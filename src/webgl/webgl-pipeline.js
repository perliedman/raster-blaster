import * as stepImplementations from './step-implementations'
import { Glob } from 'glob';

export default class WebGlPipeline {
  constructor (gl, pipeline) {
    this.pipeline = pipeline
    const steps = this.steps = pipeline.steps.map((s, i) => {
      const typeName = s.constructor.name()
      const clss = stepImplementations[typeName]
      return new clss(`${typeName}_${i}_`, s)
    })

    this.textureDefs = Object.keys(pipeline.bands)
    .map(b => ({
      name: `u_textureBand_${b}`,
      rasterBand: pipeline.bands[b]
    }))
    .concat(...steps.map(s => s.getTextures()))
    this.rasterTextures = []
    Object.keys(pipeline.bands).forEach((b, i) => {
      const texture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, texture);

      // Set the parameters so we can render any size image.
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

      this.rasterTextures[pipeline.bands[b]] = texture
    })

    this.createProgram(gl)
  }

  bindUniforms (gl, program) {
    gl.uniform1f(gl.getUniformLocation(program, 'u_flipY'), -1);
    for (let i = 0; i < this.steps.length; i++) {
      this.steps[i].bindUniforms(gl, program)
    }
  }

  async bindTextures(gl) {
    const { program } = this;
    for (let i = 0; i < this.textureDefs.length; i++) {
      const textureDef = this.textureDefs[i]
      if (textureDef.rasterBand == null) {
        gl.activeTexture(gl.TEXTURE0 + i);
        textureDef.texture = await textureDef.init(gl, program)
      }
    }
  }

  bindRasterTextures (gl, program, rasters) {
    for (let i = 0; i < this.textureDefs.length; i++) {
      const textureDef = this.textureDefs[i]
      gl.uniform1i(gl.getUniformLocation(program, textureDef.name), i);
      gl.activeTexture(gl.TEXTURE0 + i);
      if (textureDef.rasterBand != null) {
        const rasterBand = rasters[textureDef.rasterBand]
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.LUMINANCE,
          rasterBand.width,
          rasterBand.height,
          0,
          gl.LUMINANCE,
          glType(gl, rasterBand.data),
          rasterBand.data
        );
      } else {
        gl.bindTexture(gl.TEXTURE_2D, textureDef.texture);
      }
    }
  }

  createProgram (gl) {
    const addLines = source => source
      .split('\n')
      .map((line, i) => `${(i + 1).toString().padStart(3)}\t${line}`)
      .join('\n');

    this.vertexShaderSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      uniform mat3 u_matrix;
      uniform vec2 u_resolution;
      uniform float u_flipY;
      varying vec2 v_texCoord;
      void main() {
        // apply transformation matrix
        vec2 position = (u_matrix * vec3(a_position, 1)).xy;
        // convert the rectangle from pixels to 0.0 to 1.0
        vec2 zeroToOne = position / u_resolution;
        // convert from 0->1 to 0->2
        vec2 zeroToTwo = zeroToOne * 2.0;
        // convert from 0->2 to -1->+1 (clipspace)
        vec2 clipSpace = zeroToTwo - 1.0;
        gl_Position = vec4(clipSpace * vec2(1, u_flipY), 0, 1);
        // pass the texCoord to the fragment shader
        // The GPU will interpolate this value between points.
        v_texCoord = a_texCoord;
      }
    `;

    this.fragmentShaderSource = `
    precision mediump float;

    ${this.textureDefs.map(t => `
    uniform sampler2D ${t.name};
    `).join('\n')}

    ${this.steps.map(s => 
      s.getUniforms().map(u => `    uniform ${u.type} ${u.name};`).join('\n')
    ).join('\n')}

    varying vec2 v_texCoord;

    // TODO: Steps' functions should go here

    void main() {
      ${this.steps.map(s => s.main(this.pipeline) +
        ['r', 'g', 'b', 'a']
          .map(c => [c, s.mapChannel(c)])
          .filter(c => c[1])
          .map(c => `gl_FragColor.${c[0]} = ${c[1]};`)
          .join('\n'))
        .join('\n')}

      // TODO: just passing alpha in gl_FragColor does not work
      if (gl_FragColor.a == 0.0) {
        discard;
      } else {
        gl_FragColor.a = 1.0;
      }
    }
    `

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, this.vertexShaderSource);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(vertexShader) + addLines(this.vertexShaderSource));
    }

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, this.fragmentShaderSource);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(fragmentShader) + addLines(this.fragmentShaderSource));
    }

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    this.program = program
  }
}

const glType = (gl, arr) => {
  switch (arr.constructor.name) {
    case 'Uint8Array':
      return gl.UNSIGNED_BYTE
    case 'FloatArray':
      return gl.FLOAT
    default:
      throw new Error('Unhandled data type')
  }
}