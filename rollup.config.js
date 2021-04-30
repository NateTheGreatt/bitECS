import babel from '@rollup/plugin-babel'
import copy from 'rollup-plugin-copy'

const FILE = 'dist/index'
const NAME = 'bitECS'

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
    copy({
      targets: [
        { src: 'index.d.ts', dest: 'dist'}
      ]
    }),
    babel({ babelHelpers: 'bundled' })
  ]
}
