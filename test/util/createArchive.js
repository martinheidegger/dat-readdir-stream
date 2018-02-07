const hyperdrive = require('hyperdrive')
const fs = require('fs')
const os = require('os')
const path = require('path')
const bb = require('bluebird')

module.exports = names => {
  names = names || []
  const archive = hyperdrive(fs.mkdtempSync(path.join(os.tmpdir(), 'dat-readdir-stream')))

  return bb.mapSeries(names, name =>
    new Promise((resolve, reject) => {
      if (/\/$/.test(name)) {
        archive.mkdir(name, err => err ? reject(err) : resolve())
      } else {
        archive.writeFile(name, 'content', err => err ? reject(err) : resolve())
      }
    })
  ).then(() => archive)
}
