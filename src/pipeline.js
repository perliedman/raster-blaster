let nextPipelineId = 1

export default class Pipeline {
  constructor (bands, bits, steps) {
    this.id = nextPipelineId++
    this.bands = bands
    this.steps = steps
    this.bits = bits
    this.maxValue = Math.pow(2, bits) - 1
  }
}
