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

export class Rgba extends WebGlStep {
  constructor (prefix, step) {
    super(prefix, step)
  }

  main (pipeline) {
    return `
      gl_FragColor = vec4(${
        ['r', 'g', 'b', 'a'].map(b => `texture2D(u_textureBand_${b}, v_texCoord)[0]`).join(',')
      }) / ${pipeline.maxValue};
    `
  }
}

export class GrayScale extends WebGlStep {
  constructor (prefix, step) {
    super(prefix, step)
  }
}
