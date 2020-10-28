const { join } = require('path')
const { writeFileSync } = require('fs')
const glob = require('globby')
const jsdoc2md = require('jsdoc-to-markdown')

const header = '# 👾 Documentation 👾'

async function render (pattern, output) {
  const files = await glob([
    pattern,
    '!**/**/node_modules',
    '!**/**/__tests__',
    '!**/**/examples'
  ])
  const md = await jsdoc2md.render({
    files,
    plugin: 'dmd-readable'
  })
  writeFileSync(output, header + md)
}

async function build () {
  await render('src/**/*.js', join(__dirname, '..', 'DOCS.md'))
}

build().catch(console.error)
