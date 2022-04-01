import * as d3 from 'd3'
import './DatasetView.scss'
import ColorScale from '../colors'

export default class DatasetView {
  constructor (app) {
    this.app = app
    this.div = d3.select('#main').append('div').attr('id', 'dataset')
    this.svg = this.div.append('svg')

    this.pointRadius = 4
    this.margin = {
      top: 5,
      bottom: 5,
      left: 5,
      right: 5
    }
    this.width = this.svg.node().getBoundingClientRect().width - this.margin.left - this.margin.right
    this.height = this.svg.node().getBoundingClientRect().height - this.margin.top - this.margin.bottom
    this.xScale = d3.scaleLinear().domain([0, 1]).range([0, this.width])
    this.yScale = d3.scaleLinear().domain([0, 1]).range([this.height, 0])
    this.gPoints = this.createPoints('mds') // mds, pca, tsne
    this.brush = this.createBrush()
  }

  createPoints (projectionType = 'tsne') {
    const g = this.svg.append('g')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)
    g.selectAll('.tuple')
      .data(this.app.data.tuples)
      .enter()
      .append('circle')
      .attr('class', 'tuple')
      .attr('cx', d => this.xScale(d.projections[projectionType][0]))
      .attr('cy', d => this.yScale(d.projections[projectionType][1]))
      .attr('r', this.pointRadius)
      .attr('fill', d => ColorScale.probabilityColor(d.numericLabel))

    return g
  }

  createBrush () {
    const brush = d3.brush()
      .on('end', e => {
        const sel = e.selection
        console.log(sel)
      })
    this.svg.append('g').call(brush)
    return brush
  }
}
