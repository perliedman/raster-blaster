import * as stepImplementations from './step-implementations'

export default class WebGlPipeline {
  constructor (gl, pipeline) {
    const steps = this.steps = pipeline.steps.map((s, i) => {
      const typeName = s.constructor.name()
      const clss = stepImplementations[typeName]
      return new clss(`${typeName}_${i}_`, s)
    })

    this.textureDefs = Object.keys(pipeline.bands)
    .map(b => ({ name: `u_textureBand_${b}`, rasterBand: pipeline.bands[b] }))
    .concat(...steps.map(s => s.getTextures()))
    this.rasterTextures = []
    Object.keys(pipeline.bands).forEach(b => {
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);

      // Set the parameters so we can render any size image.
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

      this.rasterTextures[pipeline.bands[b]] = texture
    })
    this.program = this.createProgram()
  }

  bindUniforms (gl) {
    gl.uniform1f(gl.getUniformLocation(program, 'u_flipY'), -1);
    for (let i = 0; i < this.steps.length; i++) {
      this.steps[i].bindUniforms(gl)
    }
  }

  bindTextures (gl, rasters) {
    for (let i = 0; i < this.textureDefs[i]; i++) {
      const textureDef = this.textureDefs[i]
      gl.uniform1i(gl.getUniformLocation(program, textureDef.name), i);
      gl.activeTexture(gl.TEXTURE0 + i);
      if (textureDef.texture) {
        gl.bindTexture(gl.TEXTURE_2D, textureDef.texture);
      } else if (textureDef.rasterBand != null) {
        const data = rasters[textureDef.rasterBand]
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.LUMINANCE,
          width,
          height,
          0,
          gl.LUMINANCE,
          gl.FLOAT,
          data ? new Float32Array(data) : null,
        );
      } else {
        throw new Error('Neither texture or rasterBand is set in textureDef.')
      }
    }
  }

  createProgram () {
    return `
    precision mediump float;

    ${this.textureDefs.map(t => `
    precision samplers2D ${t.name};
    `).join('\n')}

    ${this.steps.map(s => 
      s.getUniforms().map(u => `    uniform ${u.type} ${u.name};`).join('\n')
    ).join('\n')}

    varying vec2 v_texCoord;

    // TODO: Steps' functions should go here

    void main() {
      ${this.steps.map(s => s.main(this)).join('\n')}

      // TODO: just passing alpha in gl_FragColor does not work
      if (gl_FragColor.a == 0.0) {
        discard;
      } else {
        gl_FragColor.a = 1.0;
      }
    }
    `
  }
}
