'use strict'
const path = require('path')
const Readable = require('readable-stream').Readable
const Minimatch = require('minimatch').Minimatch

function readDir (archive, folder, recursive) {
  return cb => archive.readdir(folder, {recursive: recursive}, cb)
}
function stat (archive, location) {
  return cb => archive.stat(location, cb)
}
function repeat (str, cnt) {
  const all = []
  for (let i = 0; i < cnt; i++) {
    all.push(str)
  }
  return all.join('')
}
function createSimpleGlobPattern (glob, recursive, maxDepth) {
  if (glob) {
    return glob
  }
  if (!recursive) {
    return '*'
  }
  maxDepth = parseInt(maxDepth, 10)
  if (maxDepth > 0) {
    let all = []
    for (let i = 0; i < maxDepth; i++) {
      all.push(`${repeat('*/', i + 1)}*`)
    }
    return `{*,${all.join(',')}}`
  }
  return '**/*'
}
function createGlobPattern (glob, recursive, maxDepth, cwd, globOpts) {
  glob = createSimpleGlobPattern(glob, recursive, maxDepth)
  if (!cwd || globOpts.matchBase) {
    return glob
  }
  if (!/\/$/.test(cwd)) {
    cwd += '/'
  }
  return `${cwd}${glob}`
}

module.exports = class ReaddirStream extends Readable {
  constructor (archive, opts) {
    super({
      objectMode: true
    })
    opts = Object.assign({
      cwd: '/',
      recursive: false,
      depthFirst: false,
      maxDepth: 0,
      globOpts: {},
      glob: null
    }, opts)

    this._match = new Minimatch(
      createGlobPattern(opts.glob, opts.recursive, opts.maxDepth, opts.cwd, opts.globOpts),
      opts.globOpts
    )
    this._archive = archive
    this._queue = null // Queue of the entries to check if they are a directory or not
    this._locked = 0
    this._opts = opts
    this._readFolder(opts.cwd, 0)
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
  _read () {
    if (this._destroyed) return
    if (this._locked) return // Pause processing as long as data is beeing fetched
    if (this._queue.length === 0) {
      return this.push(null)
    }
    const entry = this._queue.shift()
    const location = entry.location
    const depth = entry.depth
    this._lock(stat(this._archive, location), stat => {
      const isMatch = this._match.match(location)
      if (isMatch || stat.isDirectory()) {
        this._locked++
        this.push({location, stat})
        this._locked--
      }
      if (stat.isDirectory()) {
        return this._readFolder(location, depth + 1)
      }
      this._read()
    })
  }
  _readFolder (folder, depth) {
    this._lock(readDir(this._archive, folder, this._opts.recursive), names => {
      names = names.sort().map(name => ({
        depth,
        location: path.join(folder, name)
      }))
      if (!this._match.options.matchBase) {
        names = names.filter(entry => this._match.match(entry.location, true))
      }
      if (!this._queue) {
        this._queue = names
      } else if (this._opts.depthFirst) {
        this._queue = names.concat(this._queue)
      } else {
        this._queue = this._queue.concat(names)
      }
      this._read()
    })
  }
}
