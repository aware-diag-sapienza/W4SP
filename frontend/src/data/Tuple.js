export default class Tuple {
  constructor (d) {
    this.id = d.id
    this.data = d.data
    this.label = d.label
    this.numericLabel = d.numericLabel
    this.projections = d.projections
    this.selected = true
  }

  getValue (featureId) { return this.data[featureId] }
}
