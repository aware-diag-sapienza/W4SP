import * as d3 from 'd3'
import './PartialDependence2D.scss'
import ColorScale from '../colors'
import Utils from '../Utils'

/*

*/
const PALLINI = false
const SQUARE = true
const ALPHA = false
/*

*/
export default class PartialDependence2D {
  constructor (app) {
    this.app = app
    this.div = d3.select('#main').append('div').attr('id', 'PartialDependence2D')

    this.margin = {
      top: 15,
      bottom: 25,
      left: 25,
      right: 10
    }
    this.svg1 = this.div.append('svg').attr('id', 'svg1')
    this.svg2 = this.div.append('svg').attr('id', 'svg2')
    this.width = this.svg1.node().getBoundingClientRect().width - this.margin.left - this.margin.right
    this.height = this.svg1.node().getBoundingClientRect().height - this.margin.top - this.margin.bottom
    this.g1 = this.svg1.append('g').attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)
    this.g2 = this.svg2.append('g').attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)

    this.optionsX = d3.select('#sel-x').selectAll('option')
      .data(this.app.data.features)
      .enter()
      .append('option')
      .property('value', d => d.id)
      .text(d => d.name)

    this.optionsY = d3.select('#sel-y').selectAll('option')
      .data(this.app.data.features)
      .enter()
      .append('option')
      .property('value', d => d.id)
      .text(d => d.name)

    d3.select('#sel-show').on('click', () => {
      const fxId = parseInt(d3.select('#sel-x').property('value'))
      const fyId = parseInt(d3.select('#sel-y').property('value'))
      if (fxId === fyId) window.alert('Error: x == y')
      else this.create(fxId, fyId)
    })

    this.create(0, 1)
    /*
    d3.select('#sel-x').on('change', e => {
      const fId = d3.select(e.target).property('value')
      this.optionsY.style('display', (d, i, nodes) => d3.select(nodes[i]).property('value') === fId ? 'none' : null)
    })

    d3.select('#sel-y').on('change', e => {
      const fId = d3.select(e.target).property('value')
      this.optionsX.style('display', (d, i, nodes) => d3.select(nodes[i]).property('value') === fId ? 'none' : null)
    })
    */
  }

  async create (fxId, fyId) {
    this.g1.selectAll('*').remove()
    this.g2.selectAll('*').remove()

    const fx = this.app.data.getFeature(fxId)
    const fy = this.app.data.getFeature(fyId)
    const partialDependence = await fx.getPartialDependence2D(fy.id)
    const numClusters = Math.max(partialDependence.iceClustersX.length, partialDependence.iceClustersY.length)

    const elScale = d3.scaleBand()
      .domain(d3.range(numClusters + 1))
      .rangeRound([0, this.width])
      .padding(0.1)

    const elSize = Math.min(elScale.bandwidth(), this.height)
    const elPaddingX = elScale.bandwidth() - elSize // per centrare le matrici

    this.g1.append('text')
      .attr('class', 'label')
      .attr('text-anchor', 'end')
      .attr('y', 0)
      .attr('dy', '.75em')
      .attr('transform', 'rotate(-90)')
      .text(fx.name)

    this.g2.append('text')
      .attr('class', 'label')
      .attr('text-anchor', 'end')
      .attr('y', 0)
      .attr('dy', '.75em')
      .attr('transform', 'rotate(-90)')
      .text(fy.name)

    this.createMatrix(
      this.g1.append('g').attr('transform', `translate(${elPaddingX}, 0)`),
      elSize,
      partialDependence.pdp,
      fx,
      fy
    )
    this.createMatrix(
      this.g2.append('g').attr('transform', `translate(${elPaddingX}, 0)`),
      elSize,
      partialDependence.pdp,
      fx,
      fy
    )

    partialDependence.iceClustersX.forEach((cl, i) => {
      this.createMatrix(
        this.g1.append('g').attr('transform', `translate(${elScale(i + 1) + elPaddingX}, 0)`),
        elSize,
        cl,
        fx,
        fy,
        partialDependence.iceClustersXTuples[i]
      )
    })

    partialDependence.iceClustersY.forEach((cl, i) => {
      this.createMatrix(
        this.g2.append('g').attr('transform', `translate(${elScale(i + 1) + elPaddingX}, 0)`),
        elSize,
        cl,
        fx,
        fy,
        partialDependence.iceClustersYTuples[i]
      )
    })
  }

  createMatrix (g, size, pdp, fx, fy, clusterTuples) {
    const intervalTuples = pdp.map(d => { // tuple in ogni intervallo 2D
      return (clusterTuples === undefined) ? d.tuples : Utils.arrayIntersection(d.tuples, clusterTuples)
    })

    const xScale = d3.scaleBand()
      .domain(fx.intervals.map(d => d.id))
      .range([0, size])
      .padding(0)

    const yScale = d3.scaleBand()
      .domain(fy.intervals.map(d => d.id))
      .range([size, 0])
      .padding(0)

    const xAxis = d3.axisBottom(xScale).tickFormat((t, i) => fx.intervals[i].targetValue)
    g.append('g')
      .attr('transform', `translate(0, ${size})`)
      .attr('class', 'xAxis')
      .call(xAxis)

    g.append('text')
      .attr('class', 'xlabel')
      .attr('text-anchor', 'end')
      .attr('x', size)
      .attr('y', -5)
      .text(() => clusterTuples === undefined ? fx.name : `${fx.name} -- (${clusterTuples.length})`)

    const yAxis = d3.axisLeft(yScale).tickFormat((t, i) => fy.intervals[i].targetValue)
    g.append('g')
      .attr('transform', 'translate(0, 0)')
      .attr('class', 'yAxis')
      .call(yAxis)

    g.append('text')
      .attr('class', 'ylabel')
      .attr('text-anchor', 'end')
      .attr('y', size + 5)
      .attr('dy', '.75em')
      .attr('transform', 'rotate(-90)')
      .text(fy.name)

    const cells = g.selectAll('rect')
      .data(pdp)
      .enter()
      .append('rect')
      .attr('class', 'cell')
      .attr('x', d => xScale(d.xInterval.id))
      .attr('y', d => yScale(d.yInterval.id))
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('fill', d => ColorScale.probabilityColor(d.p))

    if (PALLINI) {
      const gPallini = g.append('g').attr('class', 'pallini')
      gPallini.selectAll('circle')
        .data(pdp)
        .enter()
        .append('circle')
        .attr('cx', d => xScale(d.xInterval.id) + xScale.bandwidth() / 2)
        .attr('cy', d => yScale(d.yInterval.id) + xScale.bandwidth() / 2)
        .attr('r', xScale.bandwidth() / 5)
        .attr('fill', (d, i) => {
          if (intervalTuples[i].length > 0) return 'black'
          else return 'transparent'
        })
    }

    if (SQUARE) {
      cells.style('display', 'none')
      const r = 0.5
      const gRect = g.append('g').attr('class', 'squares')
      gRect.selectAll('rect')
        .data(pdp)
        .enter()
        .append('rect')
        // .attr('class', 'rect')
        .attr('x', (d, i) => (intervalTuples[i].length > 0) ? xScale(d.xInterval.id) : (xScale(d.xInterval.id) + ((xScale.bandwidth() - r * xScale.bandwidth()) / 2)))
        .attr('y', (d, i) => (intervalTuples[i].length > 0) ? yScale(d.yInterval.id) : (yScale(d.yInterval.id) + ((yScale.bandwidth() - r * yScale.bandwidth()) / 2)))
        .attr('width', (d, i) => (intervalTuples[i].length > 0) ? xScale.bandwidth() : xScale.bandwidth() * r)
        .attr('height', (d, i) => (intervalTuples[i].length > 0) ? yScale.bandwidth() : yScale.bandwidth() * r)
        .attr('fill', d => ColorScale.probabilityColor(d.p))
        .attr('stroke', 'black')
    }

    if (ALPHA) {
      cells.style('display', 'none')
      const gAlpha = g.append('g').attr('class', 'alpha')
      gAlpha.selectAll('rect')
        .data(pdp)
        .enter()
        .append('rect')
        .attr('class', 'cell')
        .attr('x', d => xScale(d.xInterval.id))
        .attr('y', d => yScale(d.yInterval.id))
        .attr('width', xScale.bandwidth())
        .attr('height', yScale.bandwidth())
        .attr('fill', d => ColorScale.probabilityColor(d.p))
        .attr('fill-opacity', (d, i) => (intervalTuples[i].length > 0) ? 1 : 0.2)
        .style('stroke', (d, i) => (intervalTuples[i].length > 0) ? 'black' : 'transparent')
    }
  }
}
