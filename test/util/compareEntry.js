'use strict'
const entryToString = require('./entryToString')

module.exports = function compareEntry (t, entries, current, entry) {
  const expected = entries[current]
  t.equal(entryToString(entry), expected)
  return current + 1
}
