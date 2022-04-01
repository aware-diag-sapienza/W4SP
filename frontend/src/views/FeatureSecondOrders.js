import * as d3 from 'd3'

import FeatureSecondOrder from './FeatureSecondOrder'

export default class FeatureSecondOrders {
  constructor (dataFeature, svg, state, opts, data) {
    this.dataFeature = dataFeature
    this.influencedFrom = []
    this.data = data
    this.svg = svg
    this.entries = {}
  }

  async drawSecondOrders () {
    this.svg.selectAll('g.secondOrder')
      .data(this.influencedFrom/* .slice(0, 3) */, d => d.id)
      .join(
        enter => enter.append('g')
          .attr('class', 'secondOrder')
          .attr('transform', (d, i) => {
            let compact = 0
            let expanded = 0
            for (const j in [...Array(i).keys()]) {
              if (this.influencedFrom[j].expanded) expanded += 1
              else compact += 1
            }
            return `translate(${this.sizes.featureMargin.left},${compact * 35 + expanded * (20 + this.sizes.domainWidth)})`
          })
          .each((d, i, nodes) => {
            const e = new FeatureSecondOrder(d, this.dataFeature, d3.select(nodes[i]), this.state, this.opts, this.sizes)
            e.bindClick(this.handleToggleExpandedFeature.bind(this))
            this.entries[d.id] = e
          }),
        update => update
          .attr('transform', (d, i) => {
            let compact = 0
            let expanded = 0
            for (const j in [...Array(i).keys()]) {
              if (this.influencedFrom[j].expanded) expanded += 1
              else compact += 1
            }
            return `translate(${this.sizes.featureMargin.left},${compact * 35 + expanded * (23 + this.sizes.domainWidth)})`
          })
          .each(d => {
            this.entries[d.id].onUpdateStateOptsSizes(this.state, this.opts, this.sizes)
            this.entries[d.id].onInfluenceFeature(d)
          }),
        exit => exit.each(d => delete this.entries[d.id]).remove()
      )
  }

  handleToggleExpandedFeature (ftId) {
    this.influencedFrom = this.influencedFrom.map(ft => ({
      ...ft,
      expanded: ft.id === ftId ? !ft.expanded : ft.expanded
    }))
    this.onUpdateExpandedFeatures(ftId)
  }

  async onUpdateExpandedFeatures (ftId) {
    this.drawSecondOrders()
    this.entries[ftId].onInfluenceFeature(this.influencedFrom.filter(d => d.id === ftId)[0])
    // this.entries[ftId].onUpdateExpanded()
    let h = 0
    this.influencedFrom.forEach(d => { h += d.expanded ? (23 + this.sizes.domainWidth) : 35 })
    this.svg.attr('height', h)
  }

  onUpdateStateOptsSizes (state, opts, sizes) {
    this.state = state
    this.opts = opts
    this.sizes = sizes
    // this.drawSecondOrders()
    this.updateInfluencedFrom(this.state.featuresVisibility[this.state.featuresVisibility.map(f => f.id).indexOf(this.dataFeature.id)].selectedCluster)
  }

  updateInfluencedFrom (clusterId) {
    const featExp = {}
    this.influencedFrom.forEach(f => { featExp[f.id] = { dataFeature: f.dataFeature, expanded: f.expanded } })
    this.influencedFrom = []
    const clusterIndex = clusterId === null ? 0 : this.dataFeature.iceClusters.map(c => c.id).indexOf(clusterId)
    this.state.featuresVisibility.filter(fv => fv.visible && fv.id !== this.dataFeature.id).forEach((fv, iv) => {
      this.influencedFrom.push({
        id: fv.id,
        score: clusterId === null ? this.dataFeature.influence2D.influenceFrom.scores[fv.id] : this.dataFeature.influence2D.clustersInfluenceFrom[clusterIndex].scores[fv.id],
        correlation: this.dataFeature.correlations[fv.id],
        dataFeature: featExp[fv.id] ? featExp[fv.id].dataFeature : this.data.getFeature(fv.id),
        expanded: featExp[fv.id] ? featExp[fv.id].expanded : false
      })
    })
    const sorting = this.state.secondOrderSort.filter(s => s.selected)[0]
    if (sorting.id === 'influence') this.influencedFrom.sort((a, b) => b.score - a.score)
    else if (sorting.id === 'correlation') this.influencedFrom.sort((a, b) => b.correlation - a.correlation)
    let h = 0
    this.influencedFrom.forEach(d => { h += d.expanded ? (35 + this.sizes.domainWidth) : 35 })
    this.svg.attr('height', h)
    this.drawSecondOrders()
  }
  // TODO: clean render after features sort
}
