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
  let height = 50
  let colorScale = (_d, _i) => 'gray'
  let transition = 0
  let updateData
  let updateWidth
  let updateHeight
  let updateColorScale
  let updateTransition
  //
  function heatmap1d (selection) {
    selection.each(function () {
      const gContainer = d3.select(this)
      const xScale = d3.scaleBand()
        .range([0, width])
        .paddingOuter(0).paddingInner(0.1)
      //
      updateData = function () {
        xScale.domain([...Array(data.length).keys()])
        gContainer.selectAll('rect')
          .data(data, d => d.id)
          .join(
            enter => enter.append('rect')
              .attr('x', (d, i) => xScale(i))
              .attr('y', 0)
              .attr('width', xScale.bandwidth())
              .attr('height', height)
              .attr('fill', (d, i) => colorScale(d, i)),
            update => update
              .attr('fill', (d, i) => colorScale(d, i)),
            exit => exit.remove()
          )
      }
      updateWidth = function () {
        xScale.range([0, width])
        const sel = transition ? gContainer.selectAll('rect').transition().duration(transition) : gContainer.selectAll('rect')
        sel
          .attr('x', (d, i) => xScale(i))
          .attr('width', xScale.bandwidth())
      }
      updateHeight = function () {
        const sel = transition ? gContainer.selectAll('rect').transition().duration(transition) : gContainer.selectAll('rect')
        sel
          .attr('y', 0)
          .attr('height', height)
      }
      updateColorScale = function () {
        gContainer.selectAll('rect')
          .attr('fill', (d, i) => colorScale(d, i))
      }
      updateTransition = function () {}
      //
      updateData()
    })
  }
  //
  heatmap1d.data = function (_) {
    if (!arguments.length) return data
    data = _
    if (typeof updateData === 'function') updateData()
    return heatmap1d
  }
  heatmap1d.width = function (_) {
    if (!arguments.length) return width
    width = _
    if (typeof updateWidth === 'function') updateWidth()
    return heatmap1d
  }
  heatmap1d.height = function (_) {
    if (!arguments.length) return height
    height = _
    if (typeof updateHeight === 'function') updateHeight()
    return heatmap1d
  }
  heatmap1d.colorScale = function (_) {
    if (!arguments.length) return colorScale
    colorScale = _
    if (typeof updateColorScale === 'function') updateColorScale()
    return heatmap1d
  }
  heatmap1d.transition = function (_) {
    if (!arguments.length) return transition
    transition = _
    if (typeof updateTransition === 'function') updateTransition()
    return heatmap1d
  }

  return heatmap1d
}
