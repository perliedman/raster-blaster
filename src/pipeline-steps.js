export class BandsToChannels {
  static name () { return 'BandsToChannels' }

  constructor (mapping) {
    if (typeof mapping === 'string' || mapping instanceof String) {
      this.mapping = Array.from(mapping).reduce((a, b) => {
        a[b] = b
        return a
      }, {})
    } else {
      this.mapping = mapping
    }
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
