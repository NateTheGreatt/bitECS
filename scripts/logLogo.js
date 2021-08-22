const o = ' '
const b = '\x1b[106m \x1b[0m'
const r = '\x1b[101m \x1b[0m'

const logo = [
  [o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o],
  [o, o, r, r, o, r, r, o, o, o, r, r, o, r, r, o, o, o, r, r, o, r, r, o, o],
  [o, r, r, r, r, r, r, r, o, r, r, r, r, r, r, r, o, r, r, r, r, r, r, r, o],
  [o, r, r, r, r, r, r, r, o, r, r, r, r, r, r, r, o, r, r, r, r, r, r, r, o],
  [o, o, r, r, r, r, r, o, o, o, r, r, r, r, r, o, o, o, r, r, r, r, r, o, o],
  [o, o, o, r, r, r, o, o, o, o, o, r, r, r, o, o, o, o, o, r, r, r, o, o, o],
  [o, o, o, o, r, o, o, o, o, o, o, o, r, o, o, o, o, o, o, o, r, o, o, o, o],
  [o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o],
  [o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o],
  [o, b, o, o, o, b, o, o, o, o, o, b, b, b, o, o, b, b, o, o, o, b, b, b, o],
  [o, b, o, o, o, o, o, o, b, o, o, b, o, o, o, b, o, o, b, o, b, o, o, o, o],
  [o, b, b, b, o, b, o, b, b, b, o, b, b, o, o, b, o, o, o, o, o, b, b, o, o],
  [o, b, o, b, o, b, o, o, b, o, o, b, o, o, o, b, o, o, b, o, o, o, o, b, o],
  [o, b, b, b, o, b, o, o, b, o, o, b, b, b, o, o, b, b, o, o, b, b, b, o, o],
  [o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o],
  [o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o]
]

export function logLogo () {
  const logs = []
  for (let i = 0; i < logo.length; i++) {
    let str = ''
    for (let j = 0; j < logo[i].length; j++) {
      str += logo[i][j]
      str += logo[i][j]
    }
    logs.push(str)
  }
  logs.push('\n')
  return logs
}