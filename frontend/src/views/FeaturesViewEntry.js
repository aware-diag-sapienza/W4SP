import * as d3 from 'd3'
import ColorScale from '../colors'

export default class FeaturesViewEntry {
  constructor (app, feature, div, featuresView) {
    this.app = app
    this.featuresView = featuresView
    this.div = div
    this.feature = feature
    this.grid = this.feature.grid
    this.intervals = this.feature.intervals

    this.globalMaxNumTuplesPerInterval = d3.max(this.app.data.features.map(f => d3.max(f.intervals, int => int.tuples.length))) // tra tutte le feature
    this.relativeMaxNumTuplesPerInterval = d3.max(this.feature.intervals, int => int.tuples.length) // relativa a questa feature

    const globalMargin = {
      left: 10,
      right: 10
    }

    this.title = this.div.append('div')
      .attr('class', 'title')
      .text(this.feature.name)
      .on('click', () => {
        this.featuresView.onFeatureClick(this.feature.id)
      })

    this.container = this.div.append('div')
      .attr('class', 'container')
    this.containerW = this.container.node().getBoundingClientRect().width - globalMargin.left - globalMargin.right
    this.containerH = this.container.node().getBoundingClientRect().height

    this.gBoxplot = this.container.append('svg')
      .attr('class', 'boxplot')
      .append('g')
      .attr('transform', `translate(${globalMargin.left}, 0)`)

    this.gDistribution = this.container.append('svg')
      .attr('class', 'distribution')
      .append('g')
      .attr('transform', `translate(${globalMargin.left}, 0)`)

    this.gPdp = this.container.append('svg')
      .attr('class', 'pdp')
      .append('g')
      .attr('transform', `translate(${globalMargin.left}, 0)`)

    this.gIce = this.container.append('svg')
      .attr('class', 'ice')
      .append('g')
      .attr('transform', `translate(${globalMargin.left}, 0)`)

    //
    this.domainScale = d3.scaleLinear()
      .domain([this.feature.distribution.min, this.feature.distribution.max])
      .range([0, this.containerW])

    this.intervalScale = d3.scaleBand()
      .domain(this.intervals.map(d => d.id))
      .range([0, this.containerW])
      .paddingOuter(0)
      .paddingInner(0.1)

    this.gClusters = {}
    this.selectedCluster = null

    //
    this.createDistributionBoxplot()
    this.createDistribution()
    this.createPdp()
    this.createIce()
  }

  createDistributionBoxplot () {
    const margin = {
      top: 2,
      bottom: 2
    }
    const g = this.gBoxplot.append('g').attr('transform', `translate(0, ${margin.top})`)
    const width = this.containerW
    const height = g.node().parentNode.parentNode.getBoundingClientRect().height - margin.top - margin.bottom

    const dist = this.feature.distribution
    // hline
    g.append('line')
      .attr('class', 'boxplot hline')
      .attr('x1', this.domainScale(dist.min_w))
      .attr('y1', height / 2)
      .attr('x2', this.domainScale(dist.max_w))
      .attr('y2', height / 2)
    g.append('line')
      .attr('class', 'boxplot hline-outliers')
      .attr('x1', this.domainScale(dist.min))
      .attr('y1', height / 2)
      .attr('x2', this.domainScale(dist.max))
      .attr('y2', height / 2)
    // vline
    g.append('line')
      .attr('class', 'boxplot vline')
      .attr('x1', this.domainScale(dist.min_w))
      .attr('y1', 0)
      .attr('x2', this.domainScale(dist.min_w))
      .attr('y2', height)
    g.append('line')
      .attr('class', 'boxplot vline')
      .attr('x1', this.domainScale(dist.max_w))
      .attr('y1', 0)
      .attr('x2', this.domainScale(dist.max_w))
      .attr('y2', height)
    g.append('line')
      .attr('class', 'boxplot vline-outliers')
      .attr('x1', this.domainScale(dist.min))
      .attr('y1', 0)
      .attr('x2', this.domainScale(dist.min))
      .attr('y2', height)
    g.append('line')
      .attr('class', 'boxplot vline-outliers')
      .attr('x1', this.domainScale(dist.max))
      .attr('y1', 0)
      .attr('x2', this.domainScale(dist.max))
      .attr('y2', height)
    // box
    g.append('rect')
      .attr('class', 'boxplot box')
      .attr('x', this.domainScale(dist.q1))
      .attr('y', 0)
      .attr('width', this.domainScale(dist.q3) - this.domainScale(dist.q1))
      .attr('height', height)
    // median
    g.append('line')
      .attr('class', 'boxplot median')
      .attr('x1', this.domainScale(dist.q2))
      .attr('y1', 0)
      .attr('x2', this.domainScale(dist.q2))
      .attr('y2', height)
  }

  createDistribution () {
    const margin = {
      top: 2,
      bottom: 18
    }
    const g = this.gDistribution.append('g').attr('transform', `translate(0, ${margin.top})`)
    const width = this.containerW
    const height = g.node().parentNode.parentNode.getBoundingClientRect().height - margin.top - margin.bottom

    const xAxis = d3.axisBottom(this.domainScale)
    g.append('g')
      .attr('transform', `translate(0, ${height})`)
      .attr('class', 'xAxis')
      .call(xAxis)

    const yScale = d3.scaleLinear()
      .domain([0, this.globalMaxNumTuplesPerInterval])
      .range([0, height])

    const curve = d3.curveBumpX

    const areaGenerator = d3.area()
      .curve(curve)
      .x(d => this.intervalScale(d.id))
      .y0(height)
      .y1(d => height - yScale(d.tuples.length))

    const lineGenerator = d3.line()
      .curve(curve)
      .x(d => this.intervalScale(d.id))
      .y(d => height - yScale(d.tuples.length))

    const bw = this.intervalScale.bandwidth()
    /*
    // barchart
    g.append('g')
      .selectAll('rect')
      .data(this.intervals)
      .enter()
      .append('rect')
      .attr('class', 'distributionBar')
      .attr('x', d => this.intervalScale(d.id))
      .attr('y', d => height - yScale(d.tuples.length))
      .attr('width', bw)
      .attr('height', d => yScale(d.tuples.length))
      */

    const gArea = g.append('g')
      .attr('transform', `translate(${bw / 2}, 0)`)
    gArea.append('path')
      .attr('class', 'area original')
      .attr('d', areaGenerator(this.intervals))
    gArea.append('path')
      .attr('class', 'line original')
      .attr('d', lineGenerator(this.intervals))
  }

  createPdp () {
    const margin = {
      top: 2,
      bottom: 2
    }
    const g = this.gPdp.append('g').attr('transform', `translate(0, ${margin.top})`)
    const width = this.containerW
    const height = g.node().parentNode.parentNode.getBoundingClientRect().height - margin.top - margin.bottom

    const bw = this.intervalScale.bandwidth()
    g.append('g')
      .selectAll('rect')
      .data(this.intervals)
      .enter()
      .append('rect')
      // .attr('class', 'distributionBar')
      .attr('x', d => this.intervalScale(d.id))
      .attr('y', d => 0) // height - yScale(d.tuples.length))
      .attr('width', bw)
      .attr('height', d => height) // yScale(d.tuples.length))
      .attr('fill', (d, i) => ColorScale.probabilityColor(this.feature.singlePartialDependence[i].pd))

    const yScale = d3.scaleLinear()
      .domain([0, 1])
      .range([height, 0])

    const curve = d3.curveBumpX
    const lineGenerator = d3.line()
      .curve(curve)
      .x(d => this.intervalScale(d.id))
      .y((d, i) => yScale(this.feature.singlePartialDependence[i].pd))

    const linePoints = this.intervals.map((int, i) => {
      return {
        x: this.domainScale(int.tatgetValue),
        y: yScale(this.feature.singlePartialDependence[i].pd)
      }
    })

    g.append('g')
      .attr('transform', `translate(${this.intervalScale.bandwidth() / 2}, 0)`)
      .append('path')
      .attr('class', 'line original')
      .attr('d', lineGenerator(this.intervals))
  }

  createIce () {
    const margin = {
      top: 5,
      bottom: 5
    }
    const g = this.gIce.append('g').attr('transform', `translate(0, ${margin.top})`)
    const width = this.containerW
    const height = g.node().parentNode.parentNode.getBoundingClientRect().height - margin.top - margin.bottom
    const maxNumClusters = d3.max(this.app.data.features, f => f.iceClusters.length)

    const yScale = d3.scaleBand()
      .domain(d3.range(maxNumClusters))
      .rangeRound([0, height])
      .paddingInner(0.2)

    this.feature.iceClusters.forEach((cl, j) => {
      const gCluster = g.append('g')
        .attr('transform', `translate(0, ${yScale(j)})`)
        .attr('cluster', `${cl.id}`)
        .on('click', () => this.onFeatureClusterClick(this.feature, cl))
      this.gClusters[cl.id] = gCluster
      const cw = width
      const ch = yScale.bandwidth()
      this.createFeatureCluster(cl, cw, ch)
    })
  }

  createFeatureCluster (cluster, w, h) {
    const g = this.gIce.select(`[cluster="${cluster.id}"]`)
    const hTop = 12
    const hInfo = 14
    const hPdp = 7
    const hDist = h - hTop - hInfo - hPdp
    //
    const yScaleDist = d3.scaleLinear()
      .domain([0, this.globalMaxNumTuplesPerInterval])
      .range([0, hDist])
    const intervalsTuples = new Array(this.feature.intervals.length).fill(0)
    cluster.tuples.forEach(t => { intervalsTuples[this.feature.getTupleIntervalIndex(t)] += 1 })
    //
    const gTop = g.append('g')
    const trSym = d3.symbol().size(64)
    if (cluster.data.type === 'pos_flip' || cluster.data.type === 'neg_flip') trSym.type(d3.symbolTriangle)
    else if (cluster.data.type === 'pos' || cluster.data.type === 'neg') trSym.type(d3.symbolCircle)
    else trSym.type(d3.symbolCross)
    const trSymPath = gTop.append('path')
      .attr('transform', `translate(0,${hTop / 2})`)
      .attr('d', trSym)
      .attr('fill', '#aaa')
    if (cluster.data.type === 'neg_flip') trSymPath.attr('transform', `translate(0,${3}) scale(1,-1)`)
    gTop.append('text')
      .attr('transform', `translate(${hTop},${hTop / 2})`)
      .attr('font-size', hTop * 0.9)
      .attr('text-anchor', 'start')
      .attr('alignment-baseline', 'middle')
      .text(cluster.tuples.length)
    if (cluster.data.mk.trend === 'increasing' || cluster.data.mk.trend === 'decreasing') {
      gTop.append('text')
        .attr('transform', `translate(${w},${hTop / 2})`)
        .attr('font-size', hTop * 0.9)
        .attr('text-anchor', 'end')
        .attr('alignment-baseline', 'middle')
        .text(`SL: ${cluster.data.mk.slope.toFixed(3)}`)
    }

    const gDist = g.append('g').attr('transform', `translate(0,${hTop})`)
    gDist.selectAll('rect.dist-back')
      .data(this.intervals)
      .enter()
      .append('rect')
      .attr('class', 'dist-back')
      .attr('x', d => this.intervalScale(d.id))
      .attr('y', d => hDist - yScaleDist(d.tuples.length))
      .attr('width', this.intervalScale.bandwidth())
      .attr('height', d => yScaleDist(d.tuples.length))
      .attr('fill', '#eee')
    gDist.selectAll('rect.dist-front')
      .data(intervalsTuples)
      .enter()
      .append('rect')
      .attr('class', 'dist-front')
      .attr('x', (_d, i) => this.intervalScale(cluster.partialDependence[i].interval.id))
      .attr('y', d => hDist - yScaleDist(d))
      .attr('width', this.intervalScale.bandwidth())
      .attr('height', d => yScaleDist(d) >= 2 ? yScaleDist(d) : 0)
      .attr('fill', '#111')
    gDist.selectAll('circle')
      .data(intervalsTuples)
      .enter()
      .append('circle')
      .attr('cx', (_d, i) => this.intervalScale(cluster.partialDependence[i].interval.id) + this.intervalScale.bandwidth() / 2)
      .attr('cy', hDist)
      .attr('r', d => yScaleDist(d) > 0 && yScaleDist(d) < 2 ? this.intervalScale.bandwidth() * 0.3 : 0)
      .attr('fill', '#111')

    g.append('g')
      .attr('transform', `translate(0, ${hTop + hDist})`)
      .selectAll('rect')
      .data(cluster.partialDependence)
      .enter()
      .append('rect')
      .attr('x', d => this.intervalScale(d.interval.id))
      .attr('y', 0)
      .attr('width', this.intervalScale.bandwidth())
      .attr('height', hPdp)
      .attr('fill', d => ColorScale.probabilityColor(d.pd))
    g.append('g')
      .selectAll('line')
      .data(cluster.data.cp.slice(0, -1))
      .enter()
      .append('line')
      .attr('x1', d => d < cluster.partialDependence.length ? this.intervalScale(cluster.partialDependence[d].interval.id) : this.intervalScale.range()[1])
      .attr('x2', d => d < cluster.partialDependence.length ? this.intervalScale(cluster.partialDependence[d].interval.id) : this.intervalScale.range()[1])
      .attr('y1', hTop)
      .attr('y2', hTop + hDist + hPdp)
      .attr('stroke', 'black')
    const gInfo = g.append('g').attr('transform', `translate(0, ${hTop + hDist + hPdp})`)
  }
}

/*
function kde(sample) {
  //Epanechnikov kernel
  function epanechnikov(u) {
    return Math.abs(u) <= 1 ? 0.75 * (1 - u*u) : 0;
  };

  var kernel = epanechnikov;
  return {
    scale: function(h) {
      kernel = function (u) { return epanechnikov(u / h) / h; };
      return this;
    },

    points: function(points) {
      return points.map(function(x) {
        var y = pv.sum(sample.map(function (v) {
          return kernel(x - v);
        })) / sample.length;
        return {x: x, y: y};
      });
    }
  }
}
*/
