defaultOptions = {
  width: 256,
  height: 256
}

export default class Renderer {
  constructor (options) {
    this.options = { ...defaultOptions, options }
  }
}
