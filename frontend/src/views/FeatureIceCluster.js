import * as d3 from 'd3'

import config from '../config'
import ColorScale from '../colors'
import components from '../components'

import './FeaturesControls.scss'

const HEIGHTS = {
  head: 12,
  distribution: 40,
  pdp: 10 // 10
}
const THUMBNAIL_WIDTH = 30

export default class FeatureEntry {
  constructor (dataCluster, dataFeature, g, state, opts, sizes) {
    this.dataCluster = dataCluster
    this.dataFeature = dataFeature
    this.g = g
    this.onClick = _ => {}
    //
    this.headContainer = this.g.append('g')
    this.headContainer.append('text').attr('dominant-baseline', 'central').attr('font-size', 'x-small')
      .html(`${(this.dataCluster.tuples.length / opts.globalNumTuples * 100).toFixed(1)} %`)
    this.thumbnailContainer = this.headContainer.append('g')
    this.thumbnail = components.gHeatmap1d()
    this.globalDistributionContainer = this.g.append('g')
    this.globalDistribution = components.gBarchart()
    this.clusterDistributionContainer = this.g.append('g')
    this.clusterDistribution = components.gBarchart()
    this.pdpContainer = this.g.append('g')
    this.pdp = config.pdpStyle === 'line' ? components.gLinechart() : components.gHeatmap1d()
    this.clickContainer = this.g.append('g').on('click', (_e, d) => this.onClick(this.dataFeature.id, d.id)).style('cursor', 'pointer')
    this.clickContainer.append('rect').attr('opacity', 0).attr('stroke-opacity', 0).attr('x', 0).attr('y', 0)
    //
    this.onUpdateStateOptsSizes(state, opts, sizes)
    this.onDataCluster(dataCluster)
    //
    this.thumbnailContainer.call(this.thumbnail)
    // if (config.pdpStyle !== 'line') {
    this.globalDistributionContainer.call(this.globalDistribution)
    this.clusterDistributionContainer.call(this.clusterDistribution)
    // }
    this.pdpContainer.call(this.pdp)
    this.__onUpdateSize()
  }

  __onUpdateSize () {
    this.headContainer.select('text').attr('y', HEIGHTS.head / 2)
    this.thumbnailContainer.attr('transform', `translate(${this.sizes.domainWidth - THUMBNAIL_WIDTH},0)`)
    this.thumbnail.width(THUMBNAIL_WIDTH)
    this.thumbnail.height(HEIGHTS.head)
    this.globalDistributionContainer.attr('transform', `translate(0,${HEIGHTS.head})`)
    this.globalDistribution.width(this.sizes.domainWidth)
    this.globalDistribution.height(HEIGHTS.distribution)
    this.clusterDistributionContainer.attr('transform', `translate(0,${HEIGHTS.head})`)
    this.clusterDistribution.width(this.sizes.domainWidth)
    this.clusterDistribution.height(HEIGHTS.distribution)
    this.pdpContainer.attr('transform', `translate(0,${HEIGHTS.head + HEIGHTS.distribution})`)
    this.pdp.width(this.sizes.domainWidth)
    this.pdp.height(HEIGHTS.pdp)
    this.clickContainer.selectAll('rect').attr('width', 0).attr('height', 0)
    this.clickContainer.selectAll('rect')
      .attr('width', this.g.node().getBBox().width)
      .attr('height', this.g.node().getBBox().height)
  }

  onUpdateStateOptsSizes (state, opts, sizes) {
    this.state = state
    this.opts = opts
    this.sizes = sizes
    this.globalDistribution.maxValue(this.opts.globalMaxNumTuplesPerInterval)
    this.clusterDistribution.maxValue(this.opts.globalMaxNumTuplesPerInterval)
    this.__onUpdateSize()
  }

  onDataCluster (dataCluster) {
    this.dataCluster = dataCluster
    const globalDistributionData = this.dataFeature.intervals.map(i => ({ id: i.id, value: i.tuples.length }))
    const clusterDistributionData = this.dataFeature.intervals.map(i => ({ id: i.id, value: 0 }))
    this.dataCluster.tuples.forEach(t => { clusterDistributionData[this.dataFeature.getTupleIntervalIndex(t)].value += 1 })
    const pdpData = this.dataCluster.partialDependence.map(i => ({ id: i.id, value: i.pd }))
    this.thumbnail.data(this.state.getClusterType(this.dataCluster.data.type).thumbnail)
    this.thumbnail.colorScale((d, i) => ColorScale.probabilityColor(d.value))
    this.globalDistribution.data(globalDistributionData)
    this.clusterDistribution.data(clusterDistributionData)
    this.globalDistribution.colorScale(_ => 'lightgray')
    this.pdp.data(pdpData)
    this.pdp.colorScale((d, i) => ColorScale.probabilityColor(d.value))
  }

  bindClick (cb) { this.onClick = cb }
}
