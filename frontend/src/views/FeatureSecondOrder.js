import * as d3 from 'd3'

import ColorScale from '../colors'
import components from '../components'
import Utils from '../Utils'

import './FeaturesControls.scss'

const HEIGHTS = {
  head: 12,
  influence: 10,
  pdp: 10
}

const TRANSITION_DURATION = 750

export default class FeatureSecondOrder {
  constructor (influenceFeature, dataFeature, g, state, opts, sizes) {
    this.influenceFeature = influenceFeature
    this.dataFeature = dataFeature
    this.g = g
    this.influenceData = []
    this.pdpData = []
    this.pdpClusters = {}
    this.onClick = _ => {}
    this.selectedCluster = null
    //
    this.headContainer = this.g.append('g')
    this.influenceContainer = this.g.append('g')
    this.influence = components.gHeatmap1d()
    this.clickContainer = this.g.append('g').on('click', (_e, d) => this.onClick(d.id)).style('cursor', 'pointer')
    this.pdpContainer = this.g.append('g')
    this.pdp = components.gHeatmap2d()
    this.domainAxisContainer = this.g.append('g').attr('class', 'xAxis')
    this.domainAxisScale = d3.scaleLinear()
    this.domainAxis = d3.axisBottom(this.domainAxisScale)
    this.influenceAxisContainer = this.g.append('g').attr('class', 'yAxis')
    this.influenceAxisScale = d3.scaleLinear()
    this.influenceAxis = d3.axisRight(this.influenceAxisScale)
    this.headContainer.append('text')
      .attr('dominant-baseline', 'central')
      .attr('font-size', 'x-small')
      .html(`[${this.dataFeature.correlations[this.influenceFeature.id].toFixed(2)}] ${influenceFeature.dataFeature.name}`)
    this.headContainer.append('text')
      .attr('class', 'headScore')
      .attr('dominant-baseline', 'central')
      .attr('text-anchor', 'end')
      .attr('font-size', 'x-small')
    this.clickContainer.append('rect').attr('opacity', 0).attr('stroke-opacity', 0)

    this.onUpdateStateOptsSizes(state, opts, sizes)
    this.onInfluenceFeature(influenceFeature)
    this.onSelectedCluster(null)
    this.influenceContainer.call(this.influence)
    this.pdpContainer.call(this.pdp)
    this.domainAxisContainer.call(this.domainAxis)
    this.influenceAxisContainer.call(this.influenceAxis)
  }

  __onUpdateSize () {
    const domainWidthExp = this.sizes.domainWidth - HEIGHTS.head - 5 - 16
    // if (this.influenceFeature.expanded) this.clickContainer.selectAll('rect').attr('x', 0).attr('y', 0).attr('width', HEIGHTS.head).attr('height', HEIGHTS.influence + 5 + domainWidthExp)
    if (this.influenceFeature.expanded) this.clickContainer.selectAll('rect').attr('x', HEIGHTS.head + 5 + (domainWidthExp - this.pdp.width()) / 2).attr('y', 0).attr('width', domainWidthExp).attr('height', 5 + HEIGHTS.influence + 5)
    else this.clickContainer.selectAll('rect').attr('x', 0).attr('y', 0).attr('width', this.sizes.domainWidth).attr('height', HEIGHTS.head + 5 + HEIGHTS.influence)
    this.headContainer.selectAll('text').attr('y', HEIGHTS.head / 2)
    this.headContainer.selectAll('.headScore').attr('transform', `translate(${15 + domainWidthExp + 5 + HEIGHTS.influence + 5},0)`)
    if (this.influenceFeature.expanded) this.headContainer.selectAll('.headScore').attr('transform', `translate(${15 + domainWidthExp + 5 + HEIGHTS.influence + 5},0)`)
    else this.headContainer.selectAll('.headScore').attr('transform', `translate(${this.sizes.domainWidth},0)`)
    if (this.influenceFeature.expanded) this.headContainer.transition().duration(TRANSITION_DURATION).attr('transform', `rotate(-90) translate(${-(15 + domainWidthExp + 5 + HEIGHTS.influence + 5)},0)`)
    else this.headContainer.transition().duration(TRANSITION_DURATION).attr('transform', 'rotate(0) translate(0,0)')
    this.pdpContainer.attr('transform', `translate(${HEIGHTS.head + 5},${5 + HEIGHTS.influence + 5})`)
    this.pdp.transition(TRANSITION_DURATION)
    if (this.influenceFeature.expanded) this.pdp.maxWidth(domainWidthExp)
    else this.pdp.maxWidth(0)
    this.pdp.maxHeight(domainWidthExp)
    this.domainAxisContainer.attr('transform', `translate(${HEIGHTS.head + 5 + (domainWidthExp - this.pdp.width()) / 2},${5 + HEIGHTS.influence + 5 + this.pdp.height() + (domainWidthExp - this.pdp.height()) / 2})`)
    this.domainAxisScale.range([0, this.pdp.width()])
    this.domainAxis.scale(this.domainAxisScale)
    this.influenceAxisContainer.attr('transform', `translate(${HEIGHTS.head + 5 + this.pdp.width() + (domainWidthExp - this.pdp.width()) / 2},${5 + HEIGHTS.influence + 5 + (domainWidthExp - this.pdp.height()) / 2})`)
    this.influenceAxisScale.range([this.pdp.height(), 0])
    this.influenceAxis.scale(this.influenceAxisScale)
    if (this.influenceFeature.expanded) this.influenceContainer.transition().duration(TRANSITION_DURATION).attr('transform', `translate(${HEIGHTS.head + 5 + (domainWidthExp - this.pdp.width()) / 2},${5})`)
    else this.influenceContainer.transition().duration(TRANSITION_DURATION).attr('transform', `translate(0,${HEIGHTS.head + 5})`)
    this.influence.height(HEIGHTS.influence)
    this.influence.transition(TRANSITION_DURATION)
    if (this.influenceFeature.expanded) this.influence.width(this.pdp.width())
    else this.influence.width(this.sizes.domainWidth)
  }

  onUpdateStateOptsSizes (state, opts, sizes) {
    this.state = state
    this.opts = opts
    this.sizes = sizes
    this.onUpdateExpanded()
    this.__onUpdateSize()
    this.onUpdateEncoding()
  }

  onUpdateEncoding () {
    const e = this.state.secondOrderEncoding.filter(e => e.selected)[0]
    if (e.id === 'plain') {
      this.pdp.opacity(_ => 1)
      this.pdp.squareSize(_ => 1)
    } else if (e.id === 'opacity') {
      this.pdp.opacity(d => d.value.tuples.length > 0 ? 1 : 0.3)
      this.pdp.squareSize(_ => 1)
    } else if (e.id === 'squareSize') {
      this.pdp.opacity(_ => 1)
      this.pdp.squareSize(d => d.value.tuples.length > 0 ? 1 : 0.7)
    }
  }

  async onUpdateExpanded () {
    if (this.influenceFeature.expanded) {
      if (this.pdpData.length === 0) {
        this.pdpClusters = {}
        const res = await this.dataFeature.getPartialDependence2D(this.influenceFeature.id)
        const cix = {}
        res.fx.iceClusters.forEach((c, i) => { cix[i] = c.id })
        res.iceClustersX.forEach((pdp, i) => {
          this.pdpClusters[cix[i]] = pdp.map((d, i) => ({
            id: i,
            value: d
          }))
        })
        this.pdpData = res.pdp.map((d, i) => ({ id: i, value: d }))
      }
      // Expanded
      if (this.selectedCluster === null) this.pdp.data(this.pdpData)
      else this.pdp.data(this.pdpClusters[this.selectedCluster])
      setTimeout(_ => { if (this.influenceFeature.expanded) this.domainAxisContainer.call(this.domainAxis) }, TRANSITION_DURATION)
      setTimeout(_ => { if (this.influenceFeature.expanded) this.influenceAxisContainer.call(this.influenceAxis) }, TRANSITION_DURATION)
    } else {
      // Compact
      this.pdp.data([])
      this.domainAxisContainer.html('')
      this.influenceAxisContainer.html('')
    }
  }

  onInfluenceFeature (influenceFeature) {
    this.influenceFeature = influenceFeature
    this.influenceData = this.dataFeature.influence2D.influenceFrom.scoreVectors[this.influenceFeature.id].map((s, i) => ({ id: i, value: s }))
    // this.influence.data(this.influenceData)
    // this.influence.colorScale(d => d3.interpolateRdPu(d.value))
    this.influence.colorScale(d => ColorScale.influenceColor(d.value))
    this.pdp.colorScale((d, i) => ColorScale.probabilityColor(d.value.p))
    this.pdp.nx(this.dataFeature.intervals.length)
    this.pdp.ny(this.influenceFeature.dataFeature.intervals.length)
    this.onUpdateExpanded()
    this.__onUpdateSize()
    /*
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
    */
  }

  onSelectedCluster (clusterId) {
    this.selectedCluster = clusterId
    if (clusterId === null) {
      this.influence.data(this.influenceData)
    } else {
      const clusterIndex = this.dataFeature.iceClusters.map(c => c.id).indexOf(clusterId)
      this.influence.data(this.dataFeature.influence2D.clustersInfluenceFrom[clusterIndex].scoreVectors[this.influenceFeature.id].map((s, i) => ({ id: i, value: s })))
    }
    this.headContainer.select('.headScore').html(this.influenceFeature.score.toFixed(2))
    this.domainAxisScale.domain([this.dataFeature.distribution.min, this.dataFeature.distribution.max])
    this.domainAxis.scale(this.domainAxisScale)
    this.influenceAxisScale.domain([this.influenceFeature.dataFeature.distribution.min, this.influenceFeature.dataFeature.distribution.max])
    this.influenceAxis.scale(this.influenceAxisScale)
    this.onUpdateStateOptsSizes(this.state, this.opts, this.sizes)
  }

  bindClick (cb) { this.onClick = cb }
}
