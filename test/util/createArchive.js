'use strict'
const hyperdrive = require('hyperdrive')
const ram = require('random-access-memory')
const bb = require('bluebird')

module.exports = names => {
  names = names || []
  const archive = hyperdrive(ram)

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
