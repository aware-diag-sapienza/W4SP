import * as d3 from 'd3'

/*
[
  {
    id,
    value,
    secondary
  }
]
*/

export default function () {
  //
  let data = []
  let maxWidth = 400
  let maxHeight = 400
  let nx = 10
  let ny = 10
  let colorScale = (_d, _i) => 'gray'
  let opacity = (_d, _i) => 1
  let squareSize = (_d, _i) => 1
  let dots = (_d, _i) => 0
  let transition = 0
  let width = 0
  let height = 0
  //
  let updateData
  let updateMaxWidth
  let updateMaxHeight
  let updateNx
  let updateNy
  let updateColorScale
  let updateOpacity
  let updateSquareSize
  let updateDots
  let updateTransition
  //
  const __getScales = function () {
    const xRate = maxWidth / nx
    const yRate = maxHeight / ny
    let width, height
    let dx, dy
    if (xRate < yRate) {
      width = maxWidth
      dx = 0
      height = xRate * ny
      dy = (maxHeight - xRate * ny) / 2
    } else {
      width = yRate * nx
      dx = (maxWidth - yRate * nx) / 2
      height = maxHeight
      dy = 0
    }
    return [width, dx, height, dy]
  }

  //
  const heatmap2d = function (selection) {
    selection.each(function () {
      const gContainer = d3.select(this)
      const xScale = d3.scaleBand().paddingOuter(0).paddingInner(0.1)
      const yScale = d3.scaleBand().paddingOuter(0).paddingInner(0.1)
      const __updateRect = function (sel) {
        const cs = transition ? sel.transition().duration(transition) : sel
        cs.call(s => s
          .attr('x', (d, i) => xScale(i % nx) + xScale.bandwidth() * (1 - squareSize(d, i)) / 2)
          .attr('y', (d, i) => yScale((ny - 1) - Math.floor(i / nx)) + yScale.bandwidth() * (1 - squareSize(d, i)) / 2)
          .attr('width', (d, i) => xScale.bandwidth() * squareSize(d, i))
          .attr('height', (d, i) => yScale.bandwidth() * squareSize(d, i))
          .attr('fill', (d, i) => colorScale(d, i))
          .attr('fill-opacity', (d, i) => opacity(d, i)))
      }
      //
      updateData = function () {
        const [w, dx, h, dy] = __getScales()
        width = w
        height = h
        xScale
          .domain([...Array(nx).keys()])
          .range([dx, dx + w])
        yScale
          .domain([...Array(ny).keys()])
          .range([dy, dy + h])
        gContainer.selectAll('rect')
          .data(data, d => d.id)
          .join(
            enter => __updateRect(enter.append('rect')),
            update => __updateRect(update),
            exit => exit.remove()
          )
      }
      updateMaxWidth = function () {
        // TODO
        updateData()
      }
      updateMaxHeight = function () {
        // TODO
        updateData()
      }
      updateNx = function () {
        // TODO
        updateData()
      }
      updateNy = function () {
        // TODO
        updateData()
      }
      updateColorScale = function () {
        gContainer.selectAll('rect')
          .attr('fill', (d, i) => colorScale(d, i))
      }
      updateOpacity = function () {
        updateData()
      }
      updateSquareSize = function () {
        updateData()
      }
      updateDots = function () {
        updateData()
      }
      updateTransition = function () {}
      //
      updateData()
    })
  }
  //
  heatmap2d.data = function (_) {
    if (!arguments.length) return data
    data = _
    if (typeof updateData === 'function') updateData()
    return heatmap2d
  }
  heatmap2d.maxWidth = function (_) {
    if (!arguments.length) return maxWidth
    maxWidth = _
    if (typeof updateMaxWidth === 'function') updateMaxWidth()
    return heatmap2d
  }
  heatmap2d.maxHeight = function (_) {
    if (!arguments.length) return maxHeight
    maxHeight = _
    if (typeof updateMaxHeight === 'function') updateMaxHeight()
    return heatmap2d
  }
  heatmap2d.nx = function (_) {
    if (!arguments.length) return nx
    nx = _
    if (typeof updateNx === 'function') updateNx()
    return heatmap2d
  }
  heatmap2d.ny = function (_) {
    if (!arguments.length) return ny
    ny = _
    if (typeof updateNy === 'function') updateNy()
    return heatmap2d
  }
  heatmap2d.colorScale = function (_) {
    if (!arguments.length) return colorScale
    colorScale = _
    if (typeof updateColorScale === 'function') updateColorScale()
    return heatmap2d
  }
  heatmap2d.opacity = function (_) {
    if (!arguments.length) return opacity
    opacity = _
    if (typeof updateOpacity === 'function') updateOpacity()
    return heatmap2d
  }
  heatmap2d.squareSize = function (_) {
    if (!arguments.length) return squareSize
    squareSize = _
    if (typeof updateSquareSize === 'function') updateSquareSize()
    return heatmap2d
  }
  heatmap2d.dots = function (_) {
    if (!arguments.length) return dots
    dots = _
    if (typeof updateDots === 'function') updateDots()
    return heatmap2d
  }
  heatmap2d.transition = function (_) {
    if (!arguments.length) return transition
    transition = _
    if (typeof updateTransition === 'function') updateTransition()
    return heatmap2d
  }
  heatmap2d.width = function (_) {
    if (!arguments.length) return width
    maxWidth = _
    if (typeof updateMaxWidth === 'function') updateMaxWidth()
  }
  heatmap2d.height = function (_) {
    if (!arguments.length) return height
    maxHeight = _
    if (typeof updateMaxHeight === 'function') updateMaxHeight()
  }

  return heatmap2d
}
