'use strict'
const test = require('tap').test
const ReaddirStream = require('..')
const compareEntry = require('./util/compareEntry')
const createArchive = require('./util/createArchive')
const getEntries = require('./util/getEntries')

test('regular', t =>
  createArchive(['a', 'b', 'c/', 'c/a'])
    .then(archive => getEntries(archive))
    .then(entries => t.deepEquals(entries, ['/a', '/b', '/c/']))
)

test('regular, custom path', t =>
  createArchive(['a', 'b', 'c/', 'c/a'])
    .then(archive => getEntries(archive, {cwd: ''}))
    .then(entries => t.deepEquals(entries, ['a', 'b', 'c/']))
)

test('single hierarchy', t =>
  createArchive(['a', 'b', 'c'])
    .then(archive => getEntries(archive))
    .then(entries => t.deepEquals(entries, ['/a', '/b', '/c']))
)

test('recursive', t =>
  createArchive(['a', 'b', 'c/', 'c/a', 'd'])
    .then(archive => getEntries(archive, {recursive: true}))
    .then(entries => t.deepEquals(entries, ['/a', '/b', '/c/', '/d', '/c/a']))
)

test('recursive + depthFirst', t =>
  createArchive([
    'a',
    'b',
    'c/',
    'c/x/',
    'c/x/1',
    'c/y',
    'd'
  ])
    .then(archive => getEntries(archive, {recursive: true, depthFirst: true}))
    .then(entries => t.deepEquals(entries, ['/a', '/b', '/c/', '/c/x/', '/c/x/1', '/c/y', '/d']))
)

test('recursive + maxDepth', t =>
  createArchive([
    'a/',
    'a/b',
    'a/c/',
    'a/c/d',
    'a/c/e/',
    'a/c/e/f',
    'o'
  ])
    .then(archive =>
      getEntries(archive, {recursive: true})
        .then(entries => t.deepEquals(entries, [
          '/a/',
          '/o',
          '/a/b',
          '/a/c/',
          '/a/c/d',
          '/a/c/e/',
          '/a/c/e/f'
        ], 'default case = full depth'))
        .then(() => getEntries(archive, {recursive: true, maxDepth: 1}))
        .then(entries => t.deepEquals(entries, [
          '/a/',
          '/o',
          '/a/b',
          '/a/c/'
        ], 'One depth should be one past the current director (else you would need to switch recursive=false'))
        .then(() => getEntries(archive, {recursive: true, maxDepth: 2}))
        .then(entries => t.deepEquals(entries, [
          '/a/',
          '/o',
          '/a/b',
          '/a/c/',
          '/a/c/d',
          '/a/c/e/'
        ], 'Test with two levels'))
    )
)

test('err .readdir', t => {
  const archive = {
    readdir (name, opts, cb) {
      t.is(name, '/', 'Correct folder requested')
      setImmediate(() => cb(new Error('error-test')))
    }
  }
  return getEntries(archive)
    .then(entries => t.fail(`Unexpected data occured ${entries}`))
    .catch(e => t.equals(e.message, 'error-test', 'Correct error thrown'))
})

test('err .stat', t => {
  const archive = {
    stat (name, cb) {
      t.is(name, '/x', 'Stat called on correct item')
      setImmediate(() => cb(new Error('error-test')))
    },
    readdir (name, opts, cb) {
      setImmediate(() => cb(null, ['/x']))
    }
  }
  return getEntries(archive)
    .then(entries => t.fail(`Unexpected data occured ${entries}`))
    .catch(e => t.equals(e.message, 'error-test', 'Correct error thrown'))
})

test('destroy immediately', t => {
  const archive = {
    readdir (name, opts, cb) {
      setImmediate(() => cb(null, ['/x']))
    }
  }
  const stream = new ReaddirStream(archive)
  stream.on('data', data => t.fail(`Unexpected data occured ${data}`))
  stream.on('error', error => t.fail(`Unexpected error thrown ${error}`))
  stream.on('end', () => t.fail('unexpected end'))
  stream.destroy()
  t.end()
})

test('destroy after first read', t => {
  const archive = {
    stat (name, cb) {
      t.not(name, 'b/c', 'c is not expected as the stream should be destroyed by then')
      setImmediate(() => {
        cb(null, {
          isFile: () => name === 'a',
          isDirectory: () => name === 'b'
        })
      })
    },
    readdir (name, opts, cb) {
      let result
      if (name === '/') {
        result = ['a', 'b']
      } else if (name === 'b') {
        return cb(new Error(`Readdir called for unexpected ${name}`))
      }
      setImmediate(() => cb(null, result))
    }
  }
  const stream = new ReaddirStream(archive)
  stream.on('data', data => {
    t.not(data, '/b/c')
    if (data === 'b') {
      stream.destroy()
    } else {
      t.is(data, '/a')
    }
  })
  stream.on('error', error => t.fail(`Unexpected error thrown ${error}`))
  stream.on('end', () => t.fail('unexpected end'))
  stream.destroy()
  t.end()
})

function readWithPause (t, stream, blocks) {
  return new Promise(resolve => {
    let current = 0
    let blockNr = 0
    let entries = blocks.shift()
    stream.on('data', entry => {
      if (entries.length === current) {
        t.fail(`Unexpected entry ${entry} in block#${blockNr}`)
        return
      }
      current = compareEntry(t, entries, current, entry)
      if (!stream.isPaused() && blocks.length > 0 && entries.length > 0) {
        stream.pause()
        setTimeout(() => {
          entries = entries.concat(blocks.shift())
          blockNr += 1
          stream.resume()
        }, 200)
      }
    })
    stream.on('error', e => t.fail(e))
    stream.on('end', resolve)
    stream.pause()
    setTimeout(() => stream.resume(), 200)
  })
}

test('pause', t =>
  createArchive([
    'a',
    'b',
    'c/',
    'c/x/',
    'c/x/1',
    'c/y',
    'd'
  ])
    .then(archive =>
      readWithPause(t, new ReaddirStream(archive, {recursive: true}), [
        ['/a', '/b', '/c/', '/d'],
        ['/c/x/', '/c/y'],
        ['/c/x/1']
      ])
        .then(() =>
          readWithPause(t, new ReaddirStream(archive, {recursive: true, depthFirst: true}), [
            ['/a', '/b', '/c/'],
            ['/c/x/', '/c/x/1'],
            ['/c/y', '/d']
          ])
        )
    )
)
