'use strict'
const test = require('tap').test
const createArchive = require('./util/createArchive')
const getEntries = require('./util/getEntries')

test('simple', t =>
  createArchive(['a/', 'a/a', 'a/b', 'b/', 'b/a'])
    .then(archive => getEntries(archive, {
      glob: 'a/*'
    }))
    .then(entries => t.deepEquals(entries, ['/a/', '/a/a', '/a/b']))
)
test('supports cwd mixed with glob', t =>
  createArchive([
    'a/',
    'a/b/',
    'a/b/a',
    'b/',
    'b/a'
  ])
    .then(archive => getEntries(archive, {
      glob: 'b/*',
      cwd: 'a'
    }))
    .then(entries => t.deepEquals(entries, ['a/b/', 'a/b/a']))
)
test('globOpts get passed to minimatch', t =>
  createArchive([
    'a/',
    'a/a',
    'a/b',
    'a/c/',
    'a/c/a',
    'a/c/b',
    'b/',
    'b/b',
    'c/',
    'c/b'
  ])
    .then(archive => getEntries(archive, {
      glob: '**/b',
      globOpts: {
        noglobstar: true
      },
      cwd: 'a'
    }))
    .then(entries => t.deepEquals(entries, ['a/c/', 'a/c/b']))
)
test('matchBase globOpts should work as expected', t =>
  createArchive([
    'a/',
    'a/b',
    'b',
    'c/'
  ])
    .then(archive => getEntries(archive, {
      glob: 'b',
      globOpts: {
        matchBase: true
      }
    }))
    .then(entries => t.deepEquals(entries, ['/a/', '/b', '/c/', '/a/b']))
)
test('matchBase + depthFirst', t =>
  createArchive([
    'a/',
    'a/b',
    'b',
    'c/'
  ])
    .then(archive => getEntries(archive, {
      glob: 'b',
      depthFirst: true,
      globOpts: {
        matchBase: true
      }
    }))
    .then(entries => t.deepEquals(entries, ['/a/', '/a/b', '/b', '/c/']))
)
