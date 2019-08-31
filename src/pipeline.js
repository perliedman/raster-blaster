let nextPipelineId = 1

export default class Pipeline {
  constructor (steps, options) {
    this.id = nextPipelineId++
    this.steps = steps
    this.bands = options.bands
    if (options.bits) {
      this.bits = options.bits
      this.luminanceScale = 1 / Math.pow(2, bits) - 1
    } else if (options.dataType) {
      this.dataType = options.dataType
      this.luminanceScale = 1
    }
  }
}
