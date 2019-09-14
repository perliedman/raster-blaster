import {colormaps, colorMapsTextureImage} from './colormaps'

class WebGlStep {
  constructor (prefix, step) {
    this.prefix = prefix
    this.step = step
  }

  getUniforms () {
    return []
  }

  bindUniforms () {
    return []
  }

  getTextures () {
    return []
  }

  async bindTexture (textureDef, gl) {}

  main (pipeline) {
    return ''
  }

  mapChannel () {
    return ''
  }
}

export class BandsToChannels extends WebGlStep {
  main (pipeline) {
    return Object.keys(this.step.mapping)
      .map(b => `gl_FragColor.${this.step.mapping[b]} = texture2D(u_textureBand_${b}, v_texCoord)[0] * ${pipeline.luminanceScale.toFixed(1)};`)
      .join('\n')
  }
}

export class GrayScale extends WebGlStep {
  main () {
    const bandVariable = b => `${this.prefix}${b}`

    const regex = RegExp('\\$(\\w+)', 'g')
    let bands = new Set()
    let match

    while ((match = regex.exec(this.step.formula)) !== null) {
      bands.add(match[1])
    }

    const vName = `${this.prefix}index`

    return `
      ${Array.from(bands).map(m => `float ${bandVariable(m)} = texture2D(u_textureBand_${m}, v_texCoord)[0];`).join('\n')}
      float ${vName} = ${this.step.formula.replace(regex, (str, band) => bandVariable(band))};
      gl_FragColor = vec4(${vName}, ${vName}, ${vName}, ${vName});
    `
  }
}

export class SmoothstepContrast extends WebGlStep {
  getUniforms() {
    return [
      { name: `u_${this.prefix}low`, type: 'vec4' },
      { name: `u_${this.prefix}high`, type: 'vec4' }
    ]
  }

  bindUniforms(gl, program) {
    const { low, high } = this.step

    gl.uniform4f(
      gl.getUniformLocation(program, `u_${this.prefix}low`),
      low, low, low, low
    );
    gl.uniform4f(
      gl.getUniformLocation(program, `u_${this.prefix}high`),
      high, high, high, high
    );
  }

  main () {
    return `gl_FragColor = smoothstep(u_${this.prefix}low, u_${this.prefix}high, gl_FragColor);`
  }
}

export class ColorMap extends WebGlStep {
  getUniforms () {
    return [
      { name: `u_${this.prefix}texCoordY`, type: 'float' }
    ]
  }

  bindUniforms (gl, program) {
    gl.uniform1f(
      gl.getUniformLocation(program, `u_${this.prefix}texCoordY`),
      (colormaps[this.step.type]) / 70
    );
  }

  getTextures () {
    return [
      { name: `u_${this.prefix}colormap_texture`, init: this.bindTexture.bind(this) }
    ]
  }

  bindTexture (gl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const texture = this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
        resolve(texture)
      }
      img.onerror = reject

      img.src = colorMapsTextureImage
    })
  }

  main () {
    return `gl_FragColor = texture2D(u_${this.prefix}colormap_texture, vec2(gl_FragColor.r, u_${this.prefix}texCoordY));`
  }
}
