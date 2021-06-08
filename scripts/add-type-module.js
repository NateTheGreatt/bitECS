const {readFileSync,writeFileSync} = require('fs')

const pjson = JSON.parse(readFileSync('./package.json', 'utf-8'))

pjson.type = 'module'

writeFileSync('./package.json', JSON.stringify(pjson, null, 2))