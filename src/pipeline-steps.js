export class BandsToChannels {
  static name () { return 'BandsToChannels' }

  constructor (mapping) {
    this.mapping = mapping
  }
}

export class Index {
  static name () { return 'Index' }

  constructor (formula) {
    this.formula = formula
  }
}

export class GrayScale {
  static name () { return 'GrayScale' }
}

export class LinearContrast {
  static name () { return 'LinearContrast' }

  constructor (low, high) {
    this.low = low
    this.high = high
  }
}

export class ColorMap {
  static name () { return 'ColorMap' }

  constructor (type) {
    this.type = type
  }
}
