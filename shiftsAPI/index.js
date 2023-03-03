const jsonServer = require('json-server')
const server = jsonServer.create()
const middlewares = jsonServer.defaults()
const port = process.env.PORT || 3001

server.use(jsonServer.bodyParser)
server.use(middlewares)
server.get('/shifts', (request, response) => {
  if (request.method === 'GET') {
    const shifts = require('./shifts/index')
    response.status(200).jsonp(shifts())
  }
})
server.listen(port, () => {
  console.log('JSON Server is running')
})
