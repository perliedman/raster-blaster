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
