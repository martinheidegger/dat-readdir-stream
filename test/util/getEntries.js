'use strict'
const streamToArray = require('stream-to-array')
const ReaddirStream = require('../..')
const entryToString = require('./entryToString')

function getEntries (archive, opts) {
  return streamToArray(new ReaddirStream(archive, opts))
    .then(entries => entries.map(entryToString))
}

module.exports = getEntries
