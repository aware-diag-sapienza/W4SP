import * as d3 from 'd3'

/*
[{
  id,
  value
}]
*/

export default function () {
  //
  let data = []
  let width = 400
  let height = 100
  let colorScale = (_d, _i) => 'gray'
  let maxValue = 100
  let minHeight = 2
  let updateData
  let updateWidth
  let updateHeight
  let updateColorScale
  let updateMaxValue
  let updateMinHeight
  //
  const barchart = function (selection) {
    selection.each(function () {
      const gContainer = d3.select(this)
      const xScale = d3.scaleBand()
        .range([0, width])
        .paddingOuter(0).paddingInner(0.1)
      const yScale = d3.scaleLinear()
        .domain([0, maxValue])
        .range([0, height])
      const clipId = `barchartClip_${Math.floor(Math.random() * 999999)}`
      gContainer.append('clipPath')
        .attr('id', clipId)
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', width)
        .attr('height', height)
      //
      updateData = function () {
        xScale.domain([...Array(data.length).keys()])
        gContainer.selectAll('g')
          .data(data, d => d.id)
          .join(
            enter => {
              const gEnter = enter.append('g')
                .attr('transform', (d, i) => `translate(${xScale(i)},0)`)
              gEnter.filter(d => yScale(d.value) > minHeight).append('rect')
                .attr('x', 0)
                .attr('y', d => height - yScale(d.value))
                .attr('width', xScale.bandwidth())
                .attr('height', d => yScale(d.value))
                .attr('fill', (d, i) => colorScale(d, i))
              gEnter.filter(d => yScale(d.value) > 0 && yScale(d.value) <= minHeight).append('circle')
                .attr('cx', xScale.bandwidth() / 2)
                .attr('cy', d => height)
                .attr('r', xScale.bandwidth() * 1 / 3)
                .attr('fill', (d, i) => colorScale(d, i))
                .attr('clip-path', `url(#${clipId})`)
              return gEnter
            },
            update => update,
            exit => exit.remove()
          )
      }
      updateWidth = function () {
        xScale.range([0, width])
        gContainer.selectAll('g')
          .attr('transform', (d, i) => `translate(${xScale(i)},0)`)
        gContainer.selectAll('rect')
          .attr('width', xScale.bandwidth())
        gContainer.selectAll('circle')
          .attr('cx', xScale.bandwidth() / 2)
          .attr('r', xScale.bandwidth() * 1 / 3)
      }
      updateHeight = function () {
        yScale.range([0, height])
        updateData()
      }
      updateColorScale = function () {
        gContainer.selectAll('rect')
          .attr('fill', (d, i) => colorScale(d, i))
        gContainer.selectAll('circle')
          .attr('fill', (d, i) => colorScale(d, i))
      }
      updateMaxValue = function () {
        yScale.domain([0, maxValue])
        updateData()
      }
      updateMinHeight = function () {
        updateData()
      }
      //
      updateData()
    })
  }
  //
  barchart.data = function (_) {
    if (!arguments.length) return data
    data = _
    if (typeof updateData === 'function') updateData()
    return barchart
  }
  barchart.width = function (_) {
    if (!arguments.length) return width
    width = _
    if (typeof updateWidth === 'function') updateWidth()
    return barchart
  }
  barchart.height = function (_) {
    if (!arguments.length) return height
    height = _
    if (typeof updateHeight === 'function') updateHeight()
    return barchart
  }
  barchart.colorScale = function (_) {
    if (!arguments.length) return colorScale
    colorScale = _
    if (typeof updateColorScale === 'function') updateColorScale()
    return barchart
  }
  barchart.maxValue = function (_) {
    if (!arguments.length) return maxValue
    maxValue = _
    if (typeof updateMaxValue === 'function') updateMaxValue()
    return barchart
  }
  barchart.minHeight = function (_) {
    if (!arguments.length) return minHeight
    minHeight = _
    if (typeof updateMinHeight === 'function') updateMinHeight()
    return barchart
  }

  return barchart
}
