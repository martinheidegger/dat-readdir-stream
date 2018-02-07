const streamToArray = require('stream-to-array')
const ReaddirStream = require('../..')
const entryToString = require('./entryToString')

async function getEntries (archive, opts) {
  return (await streamToArray(new ReaddirStream(archive, opts))).map(entryToString)
}

module.exports = getEntries
