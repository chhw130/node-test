const http = require('http')

const server = http.createServer(({headers,url, method}, res) => {
    console.log({headers, url , method})
})

server.listen(3000)