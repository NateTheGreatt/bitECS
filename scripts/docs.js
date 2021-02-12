import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { writeFileSync } from 'fs'
import glob from 'globby'
import jsdoc2md from 'jsdoc-to-markdown'

const __dirname = dirname(fileURLToPath(import.meta.url))

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
  writeFileSync(output, md)
}

async function build () {
  await render('src/**/*.js', join(__dirname, '..', 'DOCS.md'))
}

build().catch(console.error)
