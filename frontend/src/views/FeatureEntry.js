import * as d3 from 'd3'

import config from '../config'
import ColorScale from '../colors'
import components from '../components'
import FeatureIceClusters from './FeatureIceClusters'
import FeatureSecondOrders from './FeatureSecondOrders'

import './FeaturesControls.scss'

const margin = {
  top: 0,
  right: 15,
  bottom: 0,
  left: 15
}

const HEIGHTS = {
  distribution: 50,
  pdp: 15, // 15
  domainAxis: 20
}

export default class FeatureEntry {
  constructor (dataFeature, div, state, opts, data) {
    this.dataFeature = dataFeature
    this.selectedIceCluster = null
    //
    this.div = div
    const scoresContainer = this.div.append('div').attr('class', 'scoresContainer')
    scoresContainer.append('div').text(dataFeature.importance.global.toFixed(2))
    scoresContainer.append('div').text(dataFeature.importance.clustersBased.toFixed(2))
    // scoresContainer.append('div').text(dataFeature.influence1D.clustersBased.toFixed(2))
    scoresContainer.append('div').text(dataFeature.influence2D.influenceTo.overallScore.toFixed(2))
    scoresContainer.append('div').text(dataFeature.influence2D.influenceFrom.overallScore.toFixed(2))
    this.div.append('div').attr('class', 'title').text(dataFeature.name)
    this.container = this.div.append('div').attr('class', 'container')
    this.featureSvg = this.container.append('svg').attr('class', 'svgFeature')
    this.distributionContainer = this.featureSvg.append('g')
    this.distribution = components.gBarchart()
    this.pdpContainer = this.featureSvg.append('g')
    this.pdp = config.pdpStyle === 'line' ? components.gLinechart() : components.gHeatmap1d()
    this.domainAxisContainer = this.featureSvg.append('g').attr('class', 'xAxis')
    this.domainAxisScale = d3.scaleLinear()
    this.domainAxis = d3.axisBottom(this.domainAxisScale)
    this.detailsContainer = this.container.append('div').attr('class', 'featureDetailsContainer')
    this.iceClustersSvg = this.detailsContainer.append('svg').attr('class', 'svgClusters')
    this.secondOrdersSvg = this.detailsContainer.append('svg').attr('class', 'svgSecondOrders')
    //
    this.iceClusters = new FeatureIceClusters(this.dataFeature, this.iceClustersSvg, this.state, this.opts)
    this.secondOrders = new FeatureSecondOrders(this.dataFeature, this.secondOrdersSvg, this.state, this.opts, data)
    this.onUpdateStateOpts(state, opts)
    this.onDataFeature(dataFeature)
    //
    // if (config.pdpStyle !== 'line') {
    this.distributionContainer.call(this.distribution)
    // }
    this.pdpContainer.call(this.pdp)
    this.domainAxisContainer.call(this.domainAxis)
    this.secondOrders.updateInfluencedFrom(null)
  }

  __getSizes () {
    this.sizes = {
      featureWidth: this.opts.featureWidth,
      featureMargin: margin,
      domainWidth: this.opts.featureWidth - margin.left - margin.right
    }
  }

  __onUpdateSize () {
    this.__getSizes()
    this.containerH = HEIGHTS.distribution + HEIGHTS.pdp + HEIGHTS.domainAxis
    this.container.style('grid-template-rows', `${this.containerH}px 1fr`)
    this.container.style('max-height', `${this.div.node().getBoundingClientRect().height - 39}px`)
    this.featureSvg.attr('width', this.sizes.featureWidth)
    this.featureSvg.attr('height', this.containerH)
    this.distributionContainer.attr('transform', `translate(${margin.left},${margin.top})`)
    this.distribution.width(this.sizes.domainWidth)
    this.distribution.height(HEIGHTS.distribution)
    this.pdpContainer.attr('transform', `translate(${margin.left},${margin.top + HEIGHTS.distribution})`)
    this.pdp.width(this.sizes.domainWidth)
    this.pdp.height(HEIGHTS.pdp)
    this.domainAxisContainer.attr('transform', `translate(${margin.left},${margin.top + HEIGHTS.distribution + HEIGHTS.pdp})`)
    this.domainAxisScale.range([0, this.sizes.domainWidth])
    this.domainAxis.scale(this.domainAxisScale)
    this.domainAxisContainer.call(this.domainAxis)
    this.iceClustersSvg.attr('width', this.sizes.featureWidth)
    this.iceClustersSvg.attr('height', 5 + this.state.clusterTypes.filter(t => t.visible).length * 75)
    this.secondOrdersSvg.attr('width', this.sizes.featureWidth)
    // this.secondOrdersSvg.attr('height', 400)
  }

  onUpdateStateOpts (state, opts) {
    this.state = state
    this.opts = opts
    this.distribution.maxValue(this.opts.globalMaxNumTuplesPerInterval)
    this.__onUpdateSize()
    this.iceClusters.onUpdateStateOptsSizes(this.state, this.opts, this.sizes)
    this.secondOrders.onUpdateStateOptsSizes(this.state, this.opts, this.sizes)
  }

  onDataFeature (dataFeature) {
    this.dataFeature = dataFeature
    const distributionData = this.dataFeature.intervals.map(i => ({ id: i.id, value: i.tuples.length }))
    const pdpData = this.dataFeature.singlePartialDependence.map(i => ({ id: i.id, value: i.pd }))
    this.distribution.data(distributionData)
    this.pdp.data(pdpData)
    this.pdp.colorScale((d, i) => ColorScale.probabilityColor(d.value))
    this.domainAxisScale.domain([this.dataFeature.distribution.min, this.dataFeature.distribution.max])
    this.domainAxis.scale(this.domainAxisScale)
    this.domainAxisContainer.call(this.domainAxis)
  }
}
