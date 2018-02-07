const path = require('path')
const { Readable } = require('stream')

function readDir (archive, folder, recursive) {
  return cb => archive.readdir(folder, {recursive}, cb)
}
function stat (archive, location) {
  return cb => archive.stat(location, cb)
}

module.exports = class ReaddirStream extends Readable {
  constructor (archive, name, opts) {
    super({
      objectMode: true
    })

    if (name !== null && typeof name === 'object') {
      opts = name
      name = null
    }

    this._archive = archive

    // Queue of the entries to check if they are a directory or not
    this._queue = null
    this._locked = 0

    this._recursive = (opts && opts.recursive) || false
    this._depthFirst = (opts && opts.depthFirst) || false
    this._maxDepth = (opts && opts.maxDepth) || 0
    this._readFolder(typeof name === 'string' ? name : '/', 0)
  }
  _lock (op, next) {
    this._locked++
    op((err, data) => {
      if (this._destroyed) return
      if (err) {
        return this.emit('error', err)
      }
      this._locked--
      next(data)
    })
  }
  _destroy () {
    this._destroyed = true
    this._archive = null
    this._queue = null
  }
  _isTooDeep (depth) {
    if (!this._recursive) {
      return true
    }
    if (this._maxDepth === 0) {
      return false
    }
    return depth >= this._maxDepth
  }
  _read () {
    if (this._destroyed) return
    if (this._locked) return // Pause processing as long as data is beeing fetched
    if (this._queue.length === 0) {
      return this.push(null)
    }
    const {location, depth} = this._queue.shift()
    this._lock(stat(this._archive, location), stat => {
      this._locked++
      this.push({location, stat})
      this._locked--
      if (stat.isDirectory() && !this._isTooDeep(depth)) {
        return this._readFolder(location, depth + 1)
      }
      this._read()
    })
  }
  _readFolder (folder, depth) {
    this._lock(readDir(this._archive, folder, this._recursive), names => {
      names = names.map(name => ({
        depth,
        location: path.join(folder, name)
      }))
      if (!this._queue) {
        this._queue = names
      } else if (this._depthFirst) {
        this._queue = names.concat(this._queue)
      } else {
        this._queue = this._queue.concat(names)
      }
      this._read()
    })
  }
}
