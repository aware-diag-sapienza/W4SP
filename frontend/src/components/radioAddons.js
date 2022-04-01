import * as d3 from 'd3'
import tippy from 'tippy.js'
import 'tippy.js/dist/tippy.css' // optional for styling
import './components.scss'

/*
[{
  id,
  icon,
  selected: bool
}]

*/

const __computeButtonClass = (d) => {
  let c = 'button'
  if (d.selected) c = `${c} is-info`
  else c = `${c} is-light`
  if (d.text) c = `${c} radBtn`
  return c
}

export default function () {
  //
  let data = []
  let updateData
  let onClick
  //
  const radioAddons = function (selection) {
    selection.each(function () {
      const dom = d3.select(this).attr('class', 'comp_radioAddons field has-addons')
      //
      updateData = function () {
        dom.selectAll('p')
          .data(data, d => d.id)
          .join(
            enter => {
              const pEnter = enter.append('p').attr('class', 'control')
              const bEnter = pEnter.append('button').attr('class', d => __computeButtonClass(d))
                .on('click', (_e, d) => onClick(d.id))
              bEnter
                .filter(d => d.icon)
                .append('span').attr('class', 'icon is-small')
                .append('i').attr('class', d => `fas fa-${d.icon}`)
              bEnter
                .filter(d => d.text)
                .append('span').attr('class', 'radText')
                .html(d => d.text)
              bEnter
                .filter(d => d.tooltip)
                .each((d, i, nodes) => {
                  tippy(nodes[i], {
                    content: d.tooltip,
                    allowHTML: true
                  })
                })
              return pEnter
            },
            update => update.select('button')
              .attr('class', d => __computeButtonClass(d)),
            exit => exit.remove()
          )
      }
      updateData()
    })
  }
  //
  radioAddons.data = function (_) {
    if (!arguments.length) return data
    data = _
    if (typeof updateData === 'function') updateData()
    return radioAddons
  }
  //
  radioAddons.bindClick = cb => { onClick = cb }

  return radioAddons
}
