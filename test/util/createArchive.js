const hyperdrive = require('hyperdrive')
const fs = require('fs')
const os = require('os')
const path = require('path')

module.exports = async (names) => {
  names = names || []
  const archive = hyperdrive(fs.mkdtempSync(path.join(os.tmpdir(), 'dat-readdir-stream')))

  for (var name of names) {
    await new Promise((resolve, reject) => {
      if (/\/$/.test(name)) {
        archive.mkdir(name, err => err ? reject(err) : resolve())
      } else {
        archive.writeFile(name, 'content', err => err ? reject(err) : resolve())
      }
    })
  }
  return archive
}
