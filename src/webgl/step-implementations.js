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
      .map(b => `gl_FragColor.${b} = texture2D(u_textureBand_${this.step.mapping[b]}, v_texCoord)[0] * ${pipeline.luminanceScale.toFixed(1)};`)
      .join(',')
  }
}

export class Index extends WebGlStep {
  main () {
    const bandVariable = b => `${this.prefix}${b}`

    const regex = RegExp('\\$(\\w+)', 'g')
    let bands = []
    let match

    while ((match = regex.exec(this.step.formula)) !== null) {
      bands.push(match[1])
    }

    const vName = `${this.prefix}index`

    return `
      ${bands.map(m => `float ${bandVariable(m)} = texture2D(u_textureBand_${m}, v_texCoord)[0];`).join('\n')}
      float ${vName} = ${this.step.formula.replace(regex, (str, band) => bandVariable(band))};
      gl_FragColor = vec4(${vName}, ${vName}, ${vName}, ${vName});
    `
  }
}

export class LinearContrast extends WebGlStep {
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
