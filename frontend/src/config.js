
module.exports = {
  SERVER_URL: () => {
    const analysis = 'global'
    const port = 11760

    let url = `http://localhost:${port}/${analysis}`
    try {
      if (window !== undefined) url = `http://${window.location.hostname}:${port}/${analysis}`
    } catch {}
    // url = './data'
    return url
  },
  pdpStyle: '' // 'line' for linechart
}
