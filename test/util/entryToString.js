'use strict'
module.exports = function entryToString (entry) {
  if (entry.stat.isDirectory()) {
    return `${entry.location}/`
  }
  return entry.location
}
