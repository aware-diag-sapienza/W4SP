export default class IceCluster {
  constructor (cl, index, feature) {
    const partialDependence = []
    for (let i = 0; i < feature.grid.length; i++) {
      partialDependence.push({
        value: feature.grid[i],
        pd: cl.pd[i],
        interval: feature.intervals[i]
      })
    }

    this.id = `iceCluster:${feature.id}-${index}`
    this.featureId = feature.id
    this.clusterId = index
    this.partialDependence = partialDependence
    this.tuples = cl.tuples
    this.data = cl.data
  }
}
