module.exports = function entryToString ({location, stat}) {
  if (stat.isDirectory()) {
    return `${location}/`
  }
  return location
}
