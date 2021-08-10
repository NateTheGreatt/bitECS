import copy from 'rollup-plugin-copy'
import ts from "rollup-plugin-ts"

const FILE = 'dist/index'
const NAME = 'bitECS'

export default {
  input: 'src/index.ts',
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
    ts({

    })
  ]
}
