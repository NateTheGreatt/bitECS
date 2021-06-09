import {readFileSync,writeFileSync} from 'fs'

const pjson = JSON.parse(readFileSync('./package.json', 'utf-8'))

delete pjson.type

writeFileSync('./package.json', JSON.stringify(pjson, null, 2))

process.exit(1)
