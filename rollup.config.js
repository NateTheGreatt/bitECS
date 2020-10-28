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
    exports: 'default'
  }, {
    name: NAME,
    file: `${FILE}.es.js`,
    sourcemap: true,
    format: 'es'
  }],
  external: [
    'react',
    'react-dom',
    'prop-types'
  ],
  plugins: [
    babel({ babelHelpers: 'bundled' }),
    terser()
  ]
}
