let nextPipelineId = 1

export default class Pipeline {
  constructor (steps, options) {
    this.id = nextPipelineId++
    this.steps = steps
    this.bands = this.bandsOptionsToBands(options.bands)
    if (options.bits) {
      this.bits = options.bits
      this.luminanceScale = 1 / Math.pow(2, bits) - 1
    } else if (options.dataType) {
      this.dataType = options.dataType
      this.luminanceScale = 1
    }
  }

  bandsOptionsToBands (x) {
    if (typeof x === 'string' || x instanceof String) {
      return Array.from(x).reduce((a, b, i) => {
        a[b] = i
        return a
      }, {})
    } else {
      return x
    }
  }
}
