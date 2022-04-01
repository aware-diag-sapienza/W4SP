export default class Interval {
  constructor (d, feature, allTuples, isLast) {
    this.id = `${feature.id}@${d.id}`
    this.featureId = feature.id

    this.minValue = d.minValue
    this.targetValue = d.targetValue
    this.maxValue = d.maxValue

    this.tuples = allTuples
      .filter(t => {
        const v = t.getValue(this.featureId)
        if (isLast) return v >= this.minValue && v <= this.maxValue
        else return v >= this.minValue && v < this.maxValue
      })
  }

  getTuples () { return this.tuples }
  getTupleIds () { return this.tuples.map(t => t.id) }
  getSelectedTuples () { return this.tuples.filter(t => t.selected) }
}
