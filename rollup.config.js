import babel from '@rollup/plugin-babel'
import { terser } from 'rollup-plugin-terser'

const FILE = 'dist/index'
const NAME = 'BitECS'

export default {
  input: 'src/index.js',
  output: [{
    name: NAME,
    file: `${FILE}.min.js`,
    sourcemap: true,
    format: 'cjs',
  }, {
    name: NAME,
    file: `${FILE}.es.js`,
    sourcemap: true,
    format: 'es'
  }],
  plugins: [
    babel({ babelHelpers: 'bundled' }),
    // terser()
  ]
}
