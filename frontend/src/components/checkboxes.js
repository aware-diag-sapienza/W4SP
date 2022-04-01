import * as d3 from 'd3'

import './components.scss'

/*
[{
  id,
  label,
  checked: bool
}]

*/
export default function () {
  //
  let data = []
  let updateData
  let onClick
  //
  const checkboxes = function (selection) {
    selection.each(function () {
      const dom = d3.select(this).attr('class', 'comp_checkboxes')
      //
      updateData = function () {
        dom.selectAll('div')
          .data(data, d => d.id)
          .join(
            enter => enter.append('div')
              .attr('class', 'field')
              .style('order', (_d, i) => i)
              .append('label')
              .attr('class', 'b-checkbox checkbox is-small')
              .call(lab => lab.append('input')
                .attr('type', 'checkbox')
                .attr('id', d => d.id)
                .property('checked', d => d.checked)
                .on('change', (_e, d) => onClick(d.id)))
              .call(lab => lab.append('span')
                .attr('class', 'check'))
              .call(lab => lab.append('span')
                .attr('class', 'control_label')
                .text(d => d.label))
              .call(lab => lab.append('span')
                .attr('class', 'tag_label')
                .text(d => d.tag)),
            update => update.style('order', (_d, i) => i)
              .call(lab => lab.select('.control_label').text(d => d.label))
              .call(lab => lab.select('.tag_label').text(d => d.tag)),
            exit => exit.remove()
          )
      }
      updateData()
    })
  }
  //
  checkboxes.data = function (_) {
    if (!arguments.length) return data
    data = _
    if (typeof updateData === 'function') updateData()
    return checkboxes
  }
  //
  checkboxes.bindClick = cb => { onClick = cb }

  return checkboxes
}
