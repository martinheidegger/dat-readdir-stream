# dat-readdir-stream

<a href="https://travis-ci.org/martinheidegger/dat-readdir-stream"><img src="https://travis-ci.org/martinheidegger/dat-readdir-stream.svg?branch=master" alt="Build Status"/></a>
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![Maintainability](https://api.codeclimate.com/v1/badges/c4e876f726815686ab87/maintainability)](https://codeclimate.com/github/martinheidegger/dat-readdir-stream/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/c4e876f726815686ab87/test_coverage)](https://codeclimate.com/github/martinheidegger/dat-readdir-stream/test_coverage)

`dat-readdir-stream` is a small util to read the file-table of a dat
as a stream, rather than through `dat.readdir`.

`npm i dat-readdir-stream --save`

### Usage 

```javascript
new ReaddirStream(archive[, opts])
```

 - `archive` [Hyperdrive](https://github.com/mafintosh/hyperdrive) archive (object).
 - `opts.cwd` Target directory path (string), defaults to `/`.
 - `opts.recursive` Read all subfolders and their files as well?
 - `opts.maxDepth` Limit the depth until which to look into folders.
 - `opts.depthFirst` Using a [depth-first search](https://en.wikipedia.org/wiki/Depth-first_search) instead of the default [breadth-first search](https://en.wikipedia.org/wiki/Breadth-first_search).
 - Returns a [readable stream](https://nodejs.org/api/stream.html#stream_class_stream_readable) in [`Object Mode`](https://nodejs.org/api/stream.html#stream_object_mode). The payload per entry is an object:
     - `entry.location` The path of the entry
     - `entry.stats` A [Stats](https://nodejs.org/api/fs.html#fs_class_fs_stats) object for that path

```javascript
const ReaddirStream = require('dat-readdir-stream')

var stream = new ReaddirStream(archive, { cwd: '/assets' })
stream.on('data', ({location, stat}) => {
  console.log(location) // => '/assets/profile.png', '/assets/styles.css'
  console.log(stat.isDirectory()) // => false, false
})

var stream = new ReaddirStream(archive, { recursive: true })
stream.on('data', ({location, stat}) => {
  console.log(location) // => '/assets', '/index.html', '/assets/profile.png', '/assets/styles.css'
})

var stream = new ReaddirStream(archive, { recursive: true, depthFirst: true })
stream.on('data', ({location, stat}) => {
  console.log(location) // => '/assets', '/assets/profile.png', '/assets/styles.css', '/index.html'
})
```

### License

MIT
