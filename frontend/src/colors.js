import * as d3 from 'd3'

export default (new class ColorScale {
  constructor () {
    this.originalColorScale = d3.interpolateRdYlBu
    // this.originalColorScale = d3.interpolateRdBu
    // this.originalColorScale = d3.interpolateRdYlGn
    this.linearScale = d3.scaleLinear()
      .domain([0, 1])
      .range([0.9, 0.1])
  }

  probabilityColor (p) { // 10 colori
    const x = Math.round(p * 10) / 10
    const y = this.linearScale(x)
    return this.originalColorScale(y)
  }

  influenceColor (v) {
    // return d3.interpolateGreys(v)
    return d3.interpolateRdPu(v)
  }

  influenceColorRelative (v) {
    const ls = d3.scaleLinear().domain([-1, 1]).range([0.9, 0.1])
    return d3.interpolateRdYlGn(ls(v))
  }
}())
