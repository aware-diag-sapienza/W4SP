import * as d3 from 'd3'

import FeatureIceCluster from './FeatureIceCluster'

export default class FeatureIceClusters {
  constructor (dataFeature, svg) {
    this.dataFeature = dataFeature
    this.svg = svg
    this.entries = {}
    // this.onUpdateStateOptsSizes(state, opts, sizes)
    // this.drawIceClusters()
  }

  drawIceClusters () {
    const sortedClusters = this.dataFeature.iceClusters.map(c => ({ ...c })).sort(this.state.clusterSort.filter(s => s.selected)[0].func)
    const filteredClusters = sortedClusters.filter(c => {
      const ix = this.state.clusterTypes.map(cl => cl.id).indexOf(c.data.type)
      return this.state.clusterTypes[ix].visible
    })
    this.svg.selectAll('g.iceCluster')
      .data(filteredClusters, d => d.id)
      .join(
        enter => enter.append('g')
          .attr('class', 'iceCluster')
          .attr('transform', (d, i) => {
            let ix = i
            if (this.state.clusterSort.filter(c => c.id === 'type') && this.state.clusterSort.filter(c => c.id === 'type')[0].selected) {
              ix = this.state.clusterTypes.filter(t => t.visible).map(t => t.id).indexOf(d.data.type)
            }
            return `translate(${this.sizes.featureMargin.left},${5 + ix * 75})`
          })
          .each((d, i, nodes) => {
            const e = new FeatureIceCluster(d, this.dataFeature, d3.select(nodes[i]), this.state, this.opts, this.sizes)
            this.entries[d.id] = e
          }),
        update => update
          .attr('transform', (d, i) => {
            let ix = i
            if (this.state.clusterSort.filter(c => c.id === 'type') && this.state.clusterSort.filter(c => c.id === 'type')[0].selected) {
              ix = this.state.clusterTypes.filter(t => t.visible).map(t => t.id).indexOf(d.data.type)
            }
            return `translate(${this.sizes.featureMargin.left},${5 + ix * 75})`
          })
          .each(d => {
            this.entries[d.id].onUpdateStateOptsSizes(this.state, this.opts, this.sizes)
          }),
        exit => exit.each(d => delete this.entries[d.id]).remove()
      )
  }

  onUpdateStateOptsSizes (state, opts, sizes) {
    this.state = state
    this.opts = opts
    this.sizes = sizes
    this.drawIceClusters()
    const selCst = this.state.featuresVisibility[this.state.featuresVisibility.map(f => f.id).indexOf(this.dataFeature.id)].selectedCluster
    const data = selCst ? [{ id: selCst }] : []
    let g = null
    this.svg.selectAll('g.iceCluster').filter(d => d.id === selCst).each(function () { g = d3.select(this) })
    this.svg.selectAll('rect.selCst')
      .data(data, d => d.id)
      .join(
        enter => enter.append('rect')
          .attr('class', 'selCst')
          .attr('transform', g ? g.attr('transform') : '')
          .attr('x', -3)
          .attr('y', -3)
          .attr('width', g ? g.node().getBBox().width + 6 : 0)
          .attr('height', g ? g.node().getBBox().height + 6 : 0)
          .attr('stroke', 'gray')
          .attr('stroke-width', 2)
          .attr('fill', 'none'),
        update => update,
        exit => exit.remove()
      )
  }
}
