import fs from 'fs-extra'
import { performance } from 'perf_hooks'
import { execSync } from 'child_process'
import { buildSync, build } from 'esbuild'
import minimist from 'minimist' 
import ora from 'ora'
import boxen from 'boxen'
import chalk from 'chalk'
import gradient from 'gradient-string'
import sloc from 'sloc'
import gzipSize from 'gzip-size'
import brotliSize from 'brotli-size'
import { sizeFormatter } from 'human-readable'
import { logLogo } from './logLogo.js'

const argv = minimist(process.argv.slice(2))
const types = argv.t || argv.types
const watch = argv.w || argv.watch

const infile = `./src/index.js`
const outdir = `./dist`
const outfileCjs = `${outdir}/index.cjs`
const outfileEsm = `${outdir}/index.mjs`

const logs = []
const times = []

const check = chalk.green.bold('✔')

function normalizeTime (ms) {
  if (ms > 1000) {
    ms /= 1000
    ms = ms.toFixed(2)
    return `${ms} seconds`
  } else {
    ms = ms.toFixed(2)
    return `${ms} ms`
  }
}

const normalizeBytes = sizeFormatter({
  std: 'JEDEC',
  decimalPlaces: 2,
  keepTrailingZeros: false,
  render: (literal, symbol) => chalk.green(`${literal} ${symbol}B`)
})

function startTimer () {
  times.push(performance.now())
}

function log (message, skipTime = false) {
  if (skipTime) {
    logs.push(message)
    return
  }

  const startTime = times[times.length - 1]
  let duration = performance.now() - startTime
  duration = normalizeTime(duration)
  logs.push(`${message} ${chalk.green(`(${duration})`)}`)
}

function endLog () {
  const logMessage = logLogo().concat(logs).join('\n')
  const boxStyle = {
    padding: 1, 
    margin: 1, 
    borderColor: 'cyanBright', 
    borderStyle: 'bold'
  }

  console.log(boxen(logMessage, boxStyle))

  logs.length = 0
  times.length = 0
}

function pkg () {
  // Capture start time
  const startTime = performance.now()

  // Get package.json
  const pkg = fs.readJsonSync(`./package.json`)
  log(`${chalk.red.bold(pkg.name)}`, true)
  log(`${chalk.dim('v')}${chalk.dim.italic(pkg.version)}`, true)
  log('', true)

  // Clear dist folder
  startTimer()
  fs.emptyDirSync(outdir, { recursive: true })
  log(`${check} Cleaned target folder`)

  // Build source
  startTimer()
  console.log()
  const cjsBuildProgress = ora('Creating CJS bundle').start()
  const cjsBuildResults = buildSync({
    entryPoints: [infile],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    sourcemap: true,
    outfile: outfileCjs
  })
  cjsBuildProgress.succeed()

  // Check for errors
  if (cjsBuildResults.errors.length > 0) {
    cjsBuildProgress.fail()
    console.log()
    console.log(`❌ ${chalk.red('CJS Build Error')}`)
    console.log(cjsBuildResults.errors)
    process.exit(1)
  }

  const esmBuildProgress = ora('Creating ESM bundle').start()
  const esmBuildResults = buildSync({
    entryPoints: [infile],
    bundle: true,
    format: 'esm',
    platform: 'node',
    sourcemap: true,
    outfile: outfileEsm
  })
  esmBuildProgress.succeed()

  // Check for errors
  if (esmBuildResults.errors.length > 0) {
    esmBuildProgress.fail()
    console.log()
    console.log(`❌ ${chalk.red('ESM Build Error')}`)
    console.log(esmBuildResults.errors)
    process.exit(1)
  }

  log(`${check} Source code built`)

  // Generate typedefs
  if (types) {
    startTimer()
    const typesProgress = ora('Generating typedefs').start()
    try {
      execSync('tsc --emitDeclarationOnly')
      typesProgress.succeed()
    } catch (err) {
      typesProgress.fail()
      console.log()
      console.log(`❌ ${chalk.white.bgRed('Typescript Error')}: ${err.message}`)
      if (err.stdout && err.stdout.length) {
        console.log(err.stdout.toString())
      }

      if (err.stderr && err.stderr.length) {
        console.log(err.stderr.toString())
      }
      process.exit(1)
    }

    log(`${check} Typedefs generated`)
  }

  // NOTE: Remove this after typescript port is done
  if (!types) {
    const typeDefProgress = ora('Copying typedefs').start()
    try {
      fs.copyFileSync('./index.d.ts', `${outdir}/index.d.ts`)
      typeDefProgress.succeed()
    } catch (err) {
      typeDefProgress.fail()
      console.log(`❌ ${chalk.white.bgRed('Error')}: ${err.message}`)
      process.exit(1)
    }
  }

  log('', true)

  // Log stats
  const loc = sloc(fs.readFileSync(outfileEsm, 'utf-8'), 'js')
  const cjsStats = fs.statSync(outfileCjs)
  const esmStats = fs.statSync(outfileEsm)
  const gzippedSize = gzipSize.fileSync(outfileEsm)
  const brotliedSize = brotliSize.fileSync(outfileEsm)

  log(`${chalk.yellow.bold('Lines of Code:')} ${chalk.green(loc.source)}`, true)
  log(`${chalk.yellow.bold('CJS Bundle:   ')} ${normalizeBytes(cjsStats.size)}`, true)
  log(`${chalk.yellow.bold('ESM Bundle:   ')} ${normalizeBytes(esmStats.size)}`, true)
  log(`${chalk.yellow.bold('Gzipped:      ')} ${normalizeBytes(gzippedSize)}`, true)
  log(`${chalk.yellow.bold('Brotlied:     ')} ${normalizeBytes(brotliedSize)}`, true)

  let duration = performance.now() - startTime
  duration = normalizeTime(duration)
  log('', true)
  log(gradient.pastel(`Build complete in ${duration}`), true)
  endLog()
}

if (watch) {
  // Initial build
  pkg()
  // Watch build ESM
  await build({
    entryPoints: [infile],
    bundle: true,
    format: 'esm',
    platform: 'node',
    sourcemap: true,
    outfile: outfileCjs,
    watch: {
      onRebuild (error) {
        if (error) {
          console.log(`❌ ${chalk.white.bgRed('Error')} ${chalk.red(`ESM ${error.message}`)}`)
        } else {
          console.log(`${check} ${chalk.green('ESM watch build succeeded')}`)
          // Build typedefs if enabled
          if (types) {
            try {
              execSync('tsc --emitDeclarationOnly')
              console.log(`${check} ${chalk.green('Typedef watch build succeeded')}`)
            } catch (err) {
              console.log(`❌ ${chalk.white.bgRed('Typescript Error')}: ${err.message}`)
              if (err.stdout && err.stdout.length) {
                console.log(err.stdout.toString())
              }

              if (err.stderr && err.stderr.length) {
                console.log(err.stderr.toString())
              }
            }
          }
        }
      }
    }
  })
  // Watch build CJS
  await build({
    entryPoints: [infile],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    sourcemap: true,
    outfile: outfileCjs,
    watch: {
      onRebuild(error) {
        if (error) {
          console.log(`❌ ${chalk.white.bgRed('Error')} ${chalk.red(`CJS ${error.message}`)}`)
        } else {
          console.log(`${check} ${chalk.green('CJS watch build succeeded')}`)
        }
      }
    }
  })
  // Log start
  console.log(`👁  ${gradient.pastel('Watching source code for changes...')}`)
} else {
  pkg()
}
