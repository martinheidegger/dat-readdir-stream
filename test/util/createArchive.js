'use strict'
const hyperdrive = require('hyperdrive')
const ram = require('random-access-memory')
const bb = require('bluebird')

function isFolder (name) {
  return /\/$/.test(name)
}

module.exports = names => {
  names = names || []
  const archive = hyperdrive(ram)
  const mkdir = (name) => new Promise((resolve, reject) =>
    archive.mkdir(name, err => err ? reject(err) : resolve())
  )
  const writeFile = (name) => new Promise((resolve, reject) => {
    archive.writeFile(name, 'content', err => err ? reject(err) : resolve())
  })

  const folders = names.filter(name => isFolder(name))
  const files = names.filter(name => !isFolder(name))

  return bb.map(folders, mkdir, {concurrency: 50})
    .then(() => bb.map(files, writeFile, {concurrency: 50}))
    .then(() => archive)
}
