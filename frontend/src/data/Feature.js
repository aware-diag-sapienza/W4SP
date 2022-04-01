import Interval from './Interval'
import Utils from '../Utils'
import IceCluster from './IceCluster'

/*
function arrayIntersection (a, b) {
  const sb = new Set(b)
  const result = [...a.values()].filter(x => sb.has(x))
  return result
}
*/

export default class Feature {
  constructor (d, intervalType, allTuples, data) {
    this.__data = data
    this.__intervalType = intervalType
    this.id = d.id
    this.name = d.name
    this.isInteger = d.isInteger
    this.intervalType = intervalType
    this.distribution = d.distribution
    this.grid = d.grid[intervalType]
    this.intervals = d.intervals[intervalType].map((int, i) => new Interval(int, this, allTuples, i === d.intervals[intervalType].length - 1))
    this.correlations = d.correlations
    this.singlePartialDependence = this.__createSinglePartialDependence(d.singlePartialDependence[intervalType])
    this.iceClusters = d.singlePartialDependence[intervalType].iceClusters.map((cl, k) => new IceCluster(cl, k, this))

    this.importance = { // float in [0, +inf] : a valore alto corrisponde importanza più alta (da Greenwell formula riadatata). Forse esiste un valore massimo per la metrica. Va controllato.
      global: d.singlePartialDependence[intervalType].featureImportance.global, // Calcolato sulla singola pdp globale
      clustersBased: d.singlePartialDependence[intervalType].featureImportance.clustersBased // Calcolato sulla singola pdp di ogni cluster e poi fatta la media pesata. Uso il numero di tuple del cluster come peso
    }

    /*
    this.influence1D = { // float in [0, +inf] : a valore alto corrisponde influenza più alta
      global: d.singlePartialDependence[intervalType].featureInfluence1D.global, // Calcolato sulla singola pdp globale
      clustersBased: d.singlePartialDependence[intervalType].featureInfluence1D.clustersBased // Calcolato sulla singola pdp di ogni cluster e poi fatta la media pesata. Uso il numero di tuple del cluster come peso
    }
    */
    this.influence2D = d.influence2D[intervalType]
  }

  __createSinglePartialDependence (data) {
    const result = []
    for (let i = 0; i < this.grid.length; i++) {
      result.push({
        value: this.grid[i],
        pd: data.pd[i],
        interval: this.intervals[i]
      })
    }
    return result
  }

  /*
  __createIceClusters (arr) {
    return arr.map((cl, k) => {
      const partialDependence = []
      for (let i = 0; i < this.grid.length; i++) {
        partialDependence.push({
          value: this.grid[i],
          pd: cl.pd[i],
          interval: this.intervals[i]
        })
      }

      return {
        id: `iceCluster:${this.id}-${k}`,
        featureId: this.id,
        clusterId: k,
        partialDependence: partialDependence,
        tuples: cl.tuples,
        data: cl.data
      }
    })
  }
  */

  __createIce (arr) {
    return this.intervals.map((int, i) => {
      return {
        xMin: int.min,
        x: int.target,
        xMax: int.max,
        tupleClassification: arr.map(d => d[i])
      }
    })
  }

  getTupleIntervalIndex (tupleIndex) {
    const intervalsTuples = this.intervals.map(i => i.tuples.map(t => t.id))
    let ix = -1
    for (let itix = 0; itix < intervalsTuples.length; itix++) {
      if (intervalsTuples[itix].indexOf(tupleIndex) > -1) {
        ix = itix
        break
      }
    }
    // TODO: Per qualche motivo alcune tuple non sono presenti in nessun intervallo. Ho forzato a 0 il loro intervallo.
    if (ix === -1) {
      console.warn('TODO Sistemare errore.', tupleIndex, this)
      return 0
    }
    return ix
  }

  async getPartialDependence2D (fyId) {
    const json = (await this.__data.getRawPartialDependence2D(this.id, fyId))[this.__intervalType]
    const fx = this
    const fy = this.__data.getFeature(parseInt(fyId))
    const nCols = fx.intervals.length
    // const nRows = fy.intervals.length
    const getCol = (i) => i % nCols
    const getRow = (i) => parseInt(Math.floor(i / nCols))

    function mappingFn (p, i) {
      const int = {
        xInterval: fx.intervals[getCol(i)],
        yInterval: fy.intervals[getRow(i)],
        p: p,
        tuples: Utils.arrayIntersection(fx.intervals[getCol(i)].getTupleIds(), fy.intervals[getRow(i)].getTupleIds()) // tuple id in the interval (all dataset)
      }
      return int
    }

    const res = {
      fx: fx,
      fy: fy,
      pdp: json.pdp.map(mappingFn),
      iceClustersX: json.iceClusters.x.map(cl => cl.map(mappingFn)),
      iceClustersY: json.iceClusters.y.map(cl => cl.map(mappingFn)),
      iceClustersXTuples: json.iceClusters.xTuples,
      iceClustersYTuples: json.iceClusters.yTuples
    }
    res.iceClustersX.forEach((c, i) => {
      c.forEach((p, j) => {
        res.iceClustersX[i][j].tuples = Utils.arrayIntersection(p.tuples, res.iceClustersXTuples[i])
      })
    })
    /*
    res.iceClustersY.forEach((c, i) => {
      c.forEach((p, j) => {
        res.iceClustersY[i][j].tuples = Utils.arrayIntersection(p.tuples, res.iceClustersYTuples[i])
      })
    })
    */
    return res
  }
}
