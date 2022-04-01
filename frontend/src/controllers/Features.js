import * as d3 from 'd3'

import FeaturesView from '../views/FeaturesView'
import FeaturesControls from '../views/FeaturesControls'

const CLUSTER_TYPES = [
  {
    id: 'pos',
    label: 'Positive',
    visible: true,
    thumbnail: [{ value: 1 }, { value: 1 }].map((t, i) => ({ ...t, id: i }))
  },
  {
    id: 'neg',
    label: 'Negative',
    visible: true,
    thumbnail: [{ value: 0 }, { value: 0 }].map((t, i) => ({ ...t, id: i }))
  },
  {
    id: 'pos_flip',
    label: 'Ascending',
    visible: true,
    thumbnail: [{ value: 0 }, { value: 1 }].map((t, i) => ({ ...t, id: i }))
  },
  {
    id: 'neg_flip',
    label: 'Descending',
    visible: true,
    thumbnail: [{ value: 1 }, { value: 0 }].map((t, i) => ({ ...t, id: i }))
  },
  {
    id: 'mix',
    label: 'Mixed',
    visible: true,
    thumbnail: [{ value: 0.5 }, { value: 0.5 }].map((t, i) => ({ ...t, id: i }))
  }
]

const CLUSTER_SORT = [
  {
    id: 'cardinality',
    icon: 'sort-amount-down',
    selected: true,
    func: (a, b) => b.tuples.length - a.tuples.length
  },
  {
    id: 'type',
    icon: 'sort-amount-up-alt',
    selected: false,
    func: (a, b) => {
      const sc = d3.scaleOrdinal()
        .domain(['pos', 'neg', 'pos_flip', 'neg_flip', 'mix'])
        .range([...Array(5).keys()])
      return sc(a.data.type) - sc(b.data.type)
    }
  }
]

const CLUSTER_FILTER_MODES = [
  {
    id: 'compact',
    icon: 'compress-alt',
    selected: true
  },
  {
    id: 'hide',
    icon: 'eye-slash',
    selected: false
  }
]

const FEATURES_SORT = [
  {
    id: 'global',
    text: 'PFI',
    selected: true,
    tooltip: 'PD-based Feature<br>Importance'
  },
  {
    id: 'clustersBased',
    text: 'SFI',
    selected: false,
    tooltip: 'STRAP-based<br>Feature Importance'
  },
  /*
  {
    id: '1dInfluence',
    text: '1D',
    selected: false
  },
  */
  {
    id: '2dInfluenceTo',
    icon: 'chevron-circle-right',
    selected: false,
    tooltip: 'Influence To<br><small>f<sub>1</sub> influences f<sub>2</sub></small>'
  },
  {
    id: '2dInfluenceFrom',
    icon: 'chevron-circle-left',
    selected: false,
    tooltip: 'Influence From<br><small>f<sub>1</sub> is influenced by f<sub>2</sub></small>'
  }
]

const SECOND_ORDER_ENCODING = [
  {
    id: 'plain',
    text: 'NO',
    selected: false,
    tooltip: 'Plain'
  },
  {
    id: 'opacity',
    text: 'OP',
    selected: true,
    tooltip: 'Opacity'
  },
  {
    id: 'squareSize',
    text: 'SZ',
    selected: false,
    tooltip: 'Square Size'
  }
]

const SECOND_ORDER_SORT = [
  {
    id: 'correlation',
    text: 'CR',
    selected: false,
    tooltip: 'By Correlation'
  },
  {
    id: 'influence',
    text: 'IN',
    selected: true,
    tooltip: 'By Influence'
  }
]

class Features {
  constructor (data) {
    //
    this.state = {
      featuresVisibility: data.features.map(f => ({ id: f.id, name: f.name, visible: true, selectedCluster: null })),
      selectedFeature: undefined,
      clusterTypes: CLUSTER_TYPES.map(c => ({ ...c })),
      clusterFilterModes: CLUSTER_FILTER_MODES.map(c => ({ ...c })),
      clusterSort: CLUSTER_SORT.map(c => ({ ...c })),
      featuresSort: FEATURES_SORT.map(f => ({ ...f })),
      secondOrderEncoding: SECOND_ORDER_ENCODING.map(e => ({ ...e })),
      secondOrderSort: SECOND_ORDER_SORT.map(s => ({ ...s })),
      getClusterType: type => this.state.clusterTypes.filter(t => t.id === type)[0]
    }
    //
    this.featuresView = new FeaturesView(data, this.state)
    //
    this.featuresControls = new FeaturesControls(data, this.state)
    this.featuresControls.clusterTypesCheckboxes.bindClick(this.handleToggleClusterType.bind(this))
    this.featuresControls.clusterFilterModes.bindClick(this.handleSelectClusterFilterMode.bind(this))
    this.featuresControls.clusterSort.bindClick(this.handleSelectClusterSort.bind(this))
    this.featuresControls.featuresSort.bindClick(this.handleSelectFeaturesSort.bind(this))
    this.featuresControls.featuresCheckboxes.bindClick(this.handleToggleFeatureVisibility.bind(this))
    this.featuresControls.secondOrderEncoding.bindClick(this.handleSelectSecondOrderEncoding.bind(this))
    this.featuresControls.secondOrderSort.bindClick(this.handleSelectSecondOrderSort.bind(this))
    Object.values(this.featuresView.entries).forEach(f => {
      Object.values(f.iceClusters.entries).forEach(c => {
        c.bindClick(this.handleToggleFeatureSelectedCluster.bind(this))
      })
    })
  }

  //
  handleToggleClusterType (ctId) {
    this.state.clusterTypes = this.state.clusterTypes.map(ct => ({
      ...ct,
      visible: ct.id === ctId ? !ct.visible : ct.visible
    }))
    this.onUpdateClusterTypes()
  }

  handleSelectClusterFilterMode (fmId) {
    this.state.clusterFilterModes = this.state.clusterFilterModes.map(fm => ({
      ...fm,
      selected: fm.id === fmId
    }))
    this.onUpdateClusterFilterModes()
  }

  handleSelectClusterSort (csId) {
    this.state.clusterSort = this.state.clusterSort.map(cs => ({
      ...cs,
      selected: cs.id === csId
    }))
    this.onUpdateClusterSort()
  }

  handleSelectFeaturesSort (fsId) {
    this.state.featuresSort = this.state.featuresSort.map(fs => ({
      ...fs,
      selected: fs.id === fsId
    }))
    this.onUpdateFeaturesSort()
  }

  handleToggleFeatureVisibility (ftId) {
    this.state.featuresVisibility = this.state.featuresVisibility.map(ft => ({
      ...ft,
      visible: ft.id === ftId ? !ft.visible : ft.visible
    }))
    this.onUpdateFeaturesVisibility(ftId)
  }

  handleToggleFeatureSelectedCluster (ftId, ctId) {
    const newSel = this.state.featuresVisibility[this.state.featuresVisibility.map(f => f.id).indexOf(ftId)].selectedCluster === ctId ? null : ctId
    this.state.featuresVisibility = this.state.featuresVisibility.map(ft => ({
      ...ft,
      selectedCluster: ft.id === ftId ? (ft.selectedCluster === ctId ? null : ctId) : ft.selectedCluster
    }))
    this.onUpdateFeaturesSelectedCluster(ftId, newSel)
  }

  handleSelectSecondOrderEncoding (enId) {
    this.state.secondOrderEncoding = this.state.secondOrderEncoding.map(en => ({
      ...en,
      selected: en.id === enId
    }))
    this.onUpdateSecondOrderEncoding()
  }

  handleSelectSecondOrderSort (ssId) {
    this.state.secondOrderSort = this.state.secondOrderSort.map(ss => ({
      ...ss,
      selected: ss.id === ssId
    }))
    this.onUpdateSecondOrderSort()
  }

  //
  onUpdateClusterTypes () {
    this.featuresControls.onClusterTypes(this.state.clusterTypes)
    this.featuresView.onUpdateState(this.state)
    Object.values(this.featuresView.entries).forEach(f => {
      Object.values(f.iceClusters.entries).forEach(c => {
        c.bindClick(this.handleToggleFeatureSelectedCluster.bind(this))
      })
    })
  }

  onUpdateClusterFilterModes () {
    this.featuresControls.onClusterFilterModes(this.state.clusterFilterModes)
    this.featuresView.onUpdateState(this.state)
  }

  onUpdateClusterSort () {
    this.featuresControls.onClusterSort(this.state.clusterSort)
    this.featuresView.onUpdateState(this.state)
  }

  onUpdateFeaturesSort () {
    this.featuresControls.onFeaturesSort(this.state.featuresSort)
    this.featuresView.onUpdateState(this.state)
  }

  onUpdateFeaturesVisibility (ftId) {
    this.featuresControls.onFeaturesVisibility(this.state.featuresVisibility)
    this.featuresView.onUpdateState(this.state)
  }

  onUpdateFeaturesSelectedCluster (ftId, ctId) {
    this.featuresView.onUpdateState(this.state)
    this.featuresView.entries[ftId].secondOrders.updateInfluencedFrom(ctId)
    Object.values(this.featuresView.entries[ftId].secondOrders.entries).forEach(e => e.onSelectedCluster(ctId))
  }

  onUpdateSecondOrderEncoding () {
    this.featuresControls.onSecondOrderEconding(this.state.secondOrderEncoding)
    this.featuresView.onUpdateState(this.state)
  }

  onUpdateSecondOrderSort () {
    this.featuresControls.onSecondOrderSort(this.state.secondOrderSort)
    this.featuresView.onUpdateState(this.state)
  }
}

export default Features
