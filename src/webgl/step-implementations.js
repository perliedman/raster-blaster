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
  main (pipeline) {
    const bandVariable = b => `${this.prefix}${b}`

    const regex = RegExp('\\$(\\w+)', 'g')
    let bands = []
    let match

    while ((match = regex.exec(this.step.formula)) !== null) {
      bands.push(match[1])
    }

    return `
      ${bands.map(m => `float ${bandVariable(m)} = texture2D(u_textureBand_${m}, v_texCoord)[0];`).join('\n')}
      float index = ${this.step.formula.replace(regex, (str, band) => bandVariable(band))};
    `
  }
}

export class GrayScale extends WebGlStep {
  mapChannel (c) {
    return c !== 'a' ? 'index' : ''
  }
}
