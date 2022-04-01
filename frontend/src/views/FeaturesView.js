import * as d3 from 'd3'

import './FeaturesView.scss'
import FeatureEntry from './FeatureEntry'

export default class FeaturesView {
  constructor (data, state) {
    this.data = data
    this.div = d3.select('#main').append('div').attr('id', 'FeaturesView')
    this.entries = {}
    this.sortFeaturesDict = {}
    this.onUpdateState(state)
  }

  //
  drawFeaturesEntries () {
    this.div.selectAll('div.feature')
      .data(this.opts.dataFeatures, d => d.id)
      .join(
        enter => enter.append('div')
          .attr('class', 'feature')
          .attr('id', d => `feat_${d.id}`)
          .style('order', d => this.sortFeaturesDict[d.id])
          .each((d, i, nodes) => {
            const e = new FeatureEntry(d, d3.select(nodes[i]), this.state, this.opts, this.data)
            this.entries[d.id] = e
          })
          .selection(),
        update => update
          .style('order', d => this.sortFeaturesDict[d.id])
          .each(d => { this.entries[d.id].onUpdateStateOpts(this.state, this.opts) }),
        exit => exit.each(d => delete this.entries[d.id]).selection().remove()
      )
  }

  onUpdateState (state) {
    this.state = state
    this.state.featuresVisibility.filter(ft => !ft.visible).forEach(ftId => delete this.entries.ftId)
    const fts = this.state.featuresVisibility.filter(ft => ft.visible)
    const dataFeatures = this.data.features.filter(f => fts.map(fv => fv.id).indexOf(f.id) >= 0)
    this.sortFeaturesDict = {}
    this.data.getSortedFeatures(this.state.featuresSort.filter(f => f.selected)[0].id).forEach((ft, fix) => { this.sortFeaturesDict[ft[0]] = fix })
    this.opts = {
      dataFeatures,
      featureWidth: this.div.node().getBoundingClientRect().width / dataFeatures.length,
      globalMaxNumTuplesPerInterval: d3.max(dataFeatures.map(f => d3.max(f.intervals, int => int.tuples.length))),
      globalNumTuples: this.data.tuples.length
    }
    this.drawFeaturesEntries()
  }
}
