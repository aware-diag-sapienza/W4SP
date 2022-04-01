const fs = require('fs')
const fetch = require('node-fetch')

const baseFolder = 'dist/data/'

async function saveTuples (serverUrl) {
  const url = serverUrl + '/tuples.json'
  console.log(url)
  const content = await fetch(url).then(res => res.json())
  fs.writeFileSync(baseFolder + 'tuples.json', JSON.stringify(content))
  console.log('DONE tuples.json')
}

async function saveFeatures (serverUrl) {
  const url = serverUrl + '/features.json'
  console.log(url)
  const content = await fetch(url).then(res => res.json())
  fs.writeFileSync(baseFolder + 'features.json', JSON.stringify(content))
  console.log('DONE features.json')
}

async function savePDP2D (serverUrl) {
  const features = await fetch(serverUrl + '/features.json').then(res => res.json())
  features.forEach(async f1 => {
    features.forEach(async f2 => {
      if (f1.id === f2.id) return
      const path = `${baseFolder}/pdp_2d/${f1.id}/${f2.id}`
      fs.mkdirSync(path, { recursive: true })
      const file = '/pdp.json'
      const url = `${serverUrl}/pdp_2d/${f1.id}/${f2.id}/pdp.json`
      const content = await fetch(url).then(res => res.json())
      fs.writeFileSync(path + file, JSON.stringify(content))
    })
  })
  console.log('DONE PDP_2D')
}

async function main () {
  const CONFIG = (await import('./src/config.js')).default
  fs.mkdirSync(baseFolder, { recursive: true })

  await saveTuples(CONFIG.SERVER_URL())
  await saveFeatures(CONFIG.SERVER_URL())
  await savePDP2D(CONFIG.SERVER_URL())
}

main()
