import * as d3 from 'd3'

import components from '../components'

import './FeaturesControls.scss'

export default class FeaturesControls {
  constructor (data, state) {
    this.div = d3.select('#main').append('div').attr('id', 'FeaturesControls')
    this.data = data
    this.state = state

    this.featuresSortContainer = this.div.append('div')
    this.featuresSort = components.radioAddons()
    this.featuresCheckboxesContainer = this.div.append('div')
    this.featuresCheckboxes = components.checkboxes()

    this.clusterSortContainer = this.div.append('div')
    this.clusterSort = components.radioAddons()
    this.clusterTypesCheckboxesContainer = this.div.append('div')
    this.clusterTypesCheckboxes = components.checkboxes()
    this.clusterFilterModesContainer = this.div.append('div')
    this.clusterFilterModes = components.radioAddons()

    this.secondOrderContainer = this.div.append('div')
      .style('display', 'flex')
      .style('justify-content', 'space-around')
    this.secondOrderSortContainer = this.secondOrderContainer.append('div')
    this.secondOrderSort = components.radioAddons()
    this.secondOrderEncodingContainer = this.secondOrderContainer.append('div')
    this.secondOrderEncoding = components.radioAddons()

    //
    this.onClusterTypes(state.clusterTypes)
    this.onClusterFilterModes(state.clusterFilterModes)
    this.onClusterSort(state.clusterSort)
    this.onFeaturesSort(state.featuresSort)
    this.onFeaturesVisibility(state.featuresVisibility)
    this.onSecondOrderEconding(state.secondOrderEncoding)
    this.onSecondOrderSort(state.secondOrderSort)
    //
    this.clusterTypesCheckboxesContainer.call(this.clusterTypesCheckboxes)
    // this.clusterFilterModesContainer.call(this.clusterFilterModes)
    this.clusterSortContainer.call(this.clusterSort)
    this.featuresSortContainer.call(this.featuresSort)
    this.featuresCheckboxesContainer.call(this.featuresCheckboxes)
    this.secondOrderEncodingContainer.call(this.secondOrderEncoding)
    this.secondOrderSortContainer.call(this.secondOrderSort)
  }

  onClusterTypes (clusterTypes) {
    const ctc = clusterTypes.map(ct => ({
      id: ct.id,
      label: ct.label,
      checked: ct.visible
    }))
    this.clusterTypesCheckboxes.data(ctc)
  }

  onClusterFilterModes (clusterFilterModes) {
    this.state.clusterFilterModes = clusterFilterModes
    const cfm = clusterFilterModes.map(fm => ({ ...fm }))
    this.clusterFilterModes.data(cfm)
  }

  onClusterSort (clusterSort) {
    this.state.clusterSort = clusterSort
    const cs = clusterSort.map(c => ({ ...c }))
    this.clusterSort.data(cs)
  }

  onFeaturesSort (featuresSort) {
    this.state.featuresSort = featuresSort
    const fs = featuresSort.map(f => ({ ...f }))
    this.featuresSort.data(fs)
    this.onFeaturesVisibility(this.state.featuresVisibility)
  }

  onFeaturesVisibility (featuresVisibility) {
    this.state.featuresVisibility = featuresVisibility
    const srf = this.data.getSortedFeatures(this.state.featuresSort.filter(f => f.selected)[0].id)
    const fts = featuresVisibility.map(ft => ({
      id: ft.id,
      label: ft.name,
      tag: srf[srf.map(f => f[0]).indexOf(ft.id)][1].toFixed(2),
      checked: ft.visible
    })).sort((a, b) => srf.map(f => f[0]).indexOf(a.id) - srf.map(f => f[0]).indexOf(b.id))
    this.featuresCheckboxes.data(fts)
  }

  onSecondOrderEconding (secondOrderEncoding) {
    this.state.secondOrderEncoding = secondOrderEncoding
    const e = secondOrderEncoding.map(e => ({ ...e }))
    this.secondOrderEncoding.data(e)
  }

  onSecondOrderSort (secondOrderSort) {
    this.state.secondOrderSort = secondOrderSort
    const ss = secondOrderSort.map(s => ({ ...s }))
    this.secondOrderSort.data(ss)
    // this.onFeaturesVisibility(this.state.featuresVisibility)
  }
}
