/* eslint-disable camelcase */
import '@fortawesome/fontawesome-free/js/fontawesome'
import '@fortawesome/fontawesome-free/js/solid'
import '@fortawesome/fontawesome-free/js/regular'
import '@fortawesome/fontawesome-free/js/brands'

import './index.scss'
import * as d3 from 'd3'
import ColorScale from './colors'
import Data from './data/Data'
import Features from './controllers/Features'
import DatasetView from './views/DatasetView'

window.app = (new class {
  constructor () {
    this.intervalType = 'uniform' // 'distributionBased'
    this.d3 = d3
    this.data = new Data(this)
    this.datasetView = null
    this.featuresController = null
    this.partialDependence2D = null
  }

  createLegend () {
    const margin = {
      top: 5,
      bottom: 20,
      left: 5,
      right: 5
    }

    const divRisk = d3.select('#main').append('div')
      .attr('id', 'legend-Risk')
      .attr('class', 'legend')
    divRisk.append('span').attr('class', 'title').text('Diabetes Risk')
    const svgRisk = divRisk.append('svg')
    const gRisk = svgRisk.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)

    const divAbsInfluence = d3.select('#main').append('div')
      .attr('id', 'legend-AbsInfluence')
      .attr('class', 'legend')
    divAbsInfluence.append('span').attr('class', 'title').text('Absolute Influence')
    const svgAbsInfluence = divAbsInfluence.append('svg')
    const gAbsInfluence = svgAbsInfluence.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)

    /*
    const divRelInfluence = d3.select('#main').append('div')
      .attr('id', 'legend-RelInfluence')
      .attr('class', 'legend')
    divRelInfluence.append('span').attr('class', 'title').text('Relative Influence')
    const svgRelInfluence = divRelInfluence.append('svg')
    const gRelInfluence = svgRelInfluence.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)
    */

    const width = svgRisk.node().getBoundingClientRect().width - margin.left - margin.right
    const height = svgRisk.node().getBoundingClientRect().height - margin.top - margin.bottom

    const elements = [
      {
        g: gRisk,
        color: (v) => ColorScale.probabilityColor(v),
        data: d3.range(11).map(v => v / 10)
      },
      {
        g: gAbsInfluence,
        color: ColorScale.influenceColor,
        data: d3.range(11).map(v => v / 10)
      }/*,
      {
        g: gRelInfluence,
        color: ColorScale.influenceColorRelative,
        data: [-1, -0.8, -0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6, 0.8, 1]
      } */
    ]

    elements.forEach(el => {
      const xScale = d3.scaleBand()
        .domain(el.data)
        .rangeRound([0, width])
        .padding(0.2)
      const xAxis = d3.axisBottom(xScale)// .tickFormat(t => `${t / 10}`) // .replace('0.', '.')

      el.g.append('g')
        .attr('transform', `translate(0, ${height})`)
        .attr('class', 'xAxis')
        .call(xAxis)

      el.g.append('g')
        .selectAll('rect')
        .data(el.data)
        .enter()
        .append('rect')
        .attr('class', 'distributionBar')
        .attr('x', d => xScale(d))
        .attr('y', 0)
        .attr('width', xScale.bandwidth())
        .attr('height', height)
        .attr('fill', d => el.color(d))
        .attr('stroke', 'black')
    })
  }

  async init () {
    await this.data.init()
    this.createLegend()
    this.datasetView = new DatasetView(this)
    this.featuresController = new Features(this.data)
  }
}())
/*
*/
window.app.init()
