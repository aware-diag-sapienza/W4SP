import Feature from './Feature'
import Tuple from './Tuple'
import * as d3 from 'd3'
import CONFIG from '../config'

export default class Data {
  constructor (app) {
    this.app = app
    // this.serverPort = 11760
    // (CONFIG.LOCATION === 'web') ? './data' : `http://${window.location.hostname}:${this.serverPort}/${CONFIG.ANALYSIS}`
    this.serverUrl = CONFIG.SERVER_URL()

    // tuples
    this.tuples = []
    this.__tuplesById = new Map()
    // features
    this.features = []
    this.__featuresById = new Map()
  }

  async init () {
    // tuples
    this.tuples = (await d3.json(this.serverUrl + '/tuples.json'))
      .map(d => new Tuple(d))
    this.tuples.forEach(t => this.__tuplesById.set(t.id, t))
    // features
    this.features = (await d3.json(this.serverUrl + '/features.json'))
      .map(d => new Feature(d, this.app.intervalType, this.tuples, this))
      // .sort((f1, f2) => f1.name.localeCompare(f2.name))
    this.features.forEach(f => this.__featuresById.set(f.id, f))

    console.log(this)

    /**
    console.log('Features per importance.global', this.features.sort((f1, f2) => f2.importance.global - f1.importance.global).map(f => [f.name, f.importance.global]))
    console.log('Features per importance.clustersBased', this.features.sort((f1, f2) => f2.importance.clustersBased - f1.importance.clustersBased).map(f => [f.name, f.importance.clustersBased]))
    console.log('Features per influence2D.scoreTo', this.features.sort((f1, f2) => f2.influence2D.influenceTo.overallScore - f1.influence2D.influenceTo.overallScore).map(f => [f.name, f.influence2D.influenceTo.overallScore]))
    console.log('Features per influence2D.scoreFrom', this.features.sort((f1, f2) => f2.influence2D.influenceFrom.overallScore - f1.influence2D.influenceFrom.overallScore).map(f => [f.name, f.influence2D.influenceFrom.overallScore]))
    console.log('Features per influence1D.global', this.features.sort((f1, f2) => f2.influence1D.global - f1.influence1D.global).map(f => [f.name, f.influence1D.global]))
    console.log('Features per influence1D.clustersBased', this.features.sort((f1, f2) => f2.influence1D.clustersBased - f1.influence1D.clustersBased).map(f => [f.name, f.influence1D.clustersBased]))
     */
  }

  getSortedFeatures (sort) {
    if (sort === 'global') return this.features.sort((f1, f2) => f2.importance.global - f1.importance.global).map(f => [f.id, f.importance.global])
    else if (sort === 'clustersBased') return this.features.sort((f1, f2) => f2.importance.clustersBased - f1.importance.clustersBased).map(f => [f.id, f.importance.clustersBased])
    else if (sort === '2dInfluenceTo') return this.features.sort((f1, f2) => f2.influence2D.influenceTo.overallScore - f1.influence2D.influenceTo.overallScore).map(f => [f.id, f.influence2D.influenceTo.overallScore])
    else if (sort === '2dInfluenceFrom') return this.features.sort((f1, f2) => f2.influence2D.influenceFrom.overallScore - f1.influence2D.influenceFrom.overallScore).map(f => [f.id, f.influence2D.influenceFrom.overallScore])
    else if (sort === '1dInfluence') return this.features.sort((f1, f2) => f2.influence1D.clustersBased - f1.influence1D.clustersBased).map(f => [f.id, f.influence1D.clustersBased])
    console.log('data.getSortedFeatures - unknown sort')
    return this.features
  }

  getTuple (id) { return this.__tuplesById.get(id) }

  getFeature (id) { return this.__featuresById.get(id) }

  async getRawPartialDependence2D (fxId, fyId) {
    // const url = `${this.serverUrl}/pdp_2d?fx=${fxId}&fy=${fyId}`
    const url = `${this.serverUrl}/pdp_2d/${fxId}/${fyId}/pdp.json`
    const json = await d3.json(url)
    return json
  }
}
