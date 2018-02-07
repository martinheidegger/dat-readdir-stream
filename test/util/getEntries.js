const streamToArray = require('stream-to-array')
const ReaddirStream = require('../..')
const entryToString = require('./entryToString')

async function getEntries (archive, name, opts) {
  return (await streamToArray(new ReaddirStream(archive, name, opts))).map(entryToString)
}

module.exports = getEntries
