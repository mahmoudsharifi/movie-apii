const url = require('url')
const { readFileSync, writeFileSync } = require('fs')
const { join } = require('path')

const http = require('http')

const server = http.createServer((request, response) => {
  console.log('here', addr)
  let addr = request.url
  let { path } = url.parse(addr, true)

  if (path.includes('documentation')) {
    var fileName = 'documentation.html'
  } else {
    var fileName = 'index.html'
  }

  let filePath = join(__dirname, fileName)
  let file = readFileSync(filePath)

  let date = new Date()
  let timestamp = `${date.getFullYear()}/${date.getMonth()}/${date.getDate()} - ${date.getHours()}:${date.getMinutes()}`
  updateLog(`${filePath} / ${timestamp} \n`)

  response.write(file)
  response.end()
})

function updateLog(str) {
  writeFileSync(join(__dirname, 'log.txt'), str, {
    encoding: 'utf-8',
    flag: 'a',
  })
}

server.listen(8080)

// node --watch server.js
