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
  function linechart (selection) {
    console.log(data)
    selection.each(function () {
      const gContainer = d3.select(this)
      const xScale = d3.scaleBand()
        .range([0, width])
        .paddingOuter(0).paddingInner(0.1)
      const yScale = d3.scaleLinear()
        .domain([0, 1])
        .range([height, 0])
      const lineGenerator = d3.line()
        .curve(d3.curveBasis)
        /*
        .x((d, i) => xScale(i))
        .y(d => yScale(d.value))
        */
        .x(d => d.x)
        .y(d => d.y)
      //

      //
      updateData = function () {
        xScale.domain([...Array(data.length).keys()])

        const pathData = data.map((d, i) => {
          return {
            x: xScale(i),
            y: yScale(d.value)
          }
        })
        pathData.unshift(pathData[0])
        pathData.push(pathData[pathData.length - 1])

        pathData[0].x = 0
        pathData[pathData.length - 1].x = width

        gContainer.append('path')
          .attr('d', lineGenerator(pathData))
          .attr('fill', 'transparent')
          .attr('stroke', 'black')
          .attr('stroke-width', '2px')

        /*
        gContainer.append('g').attr('transform', `translate(${xScale.bandwidth() / 2},0)`)
          .selectAll('path')
          .data([{ id: 0, data: data }], d => d.id)
          .join(
            enter => enter.append('path')
              .attr('d', d => lineGenerator(d.data))
              .attr('fill', 'transparent')
              .attr('stroke', 'black')
              .attr('stroke-width', '2px'),
            update => update
              .attr('fill', 'transparent')
              .attr('stroke', 'black'),
            exit => exit.remove()
          )
        */

        gContainer.append('g').call(
          d3.axisLeft(yScale)
            .tickValues([0, 1])
            .tickFormat(d3.format('d'))
        )

        gContainer.append('line')
          .attr('x1', 0)
          .attr('x2', width)
          .attr('y1', 0)
          .attr('y2', 0)
          .attr('stroke', 'black')
          .attr('stroke-width', '0.5px')

        gContainer.append('line')
          .attr('x1', 0)
          .attr('x2', width)
          .attr('y1', height)
          .attr('y2', height)
          .attr('stroke', 'black')
          .attr('stroke-width', '0.5px')
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
      updateColorScale = function () {}
      updateTransition = function () {}
      //
      updateData()
    })
  }
  //
  linechart.data = function (_) {
    if (!arguments.length) return data
    data = _
    if (typeof updateData === 'function') updateData()
    return linechart
  }
  linechart.width = function (_) {
    if (!arguments.length) return width
    width = _
    if (typeof updateWidth === 'function') updateWidth()
    return linechart
  }
  linechart.height = function (_) {
    if (!arguments.length) return height
    height = _
    if (typeof updateHeight === 'function') updateHeight()
    return linechart
  }
  linechart.colorScale = function (_) {
    if (!arguments.length) return colorScale
    colorScale = _
    if (typeof updateColorScale === 'function') updateColorScale()
    return linechart
  }
  linechart.transition = function (_) {
    if (!arguments.length) return transition
    transition = _
    if (typeof updateTransition === 'function') updateTransition()
    return linechart
  }

  return linechart
}
