import babel from '@rollup/plugin-babel'

const FILE = 'dist/index'
const NAME = 'BitECS'

export default {
  input: 'src/index.js',
  output: [{
    name: NAME,
    file: `${FILE}.js`,
    sourcemap: true,
    format: 'cjs',
  }, {
    name: NAME,
    file: `${FILE}.es.js`,
    sourcemap: true,
    format: 'es'
  }],
  plugins: [
    babel({ babelHelpers: 'bundled' })
  ]
}
