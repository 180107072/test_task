import amqp from 'amqplib'
import { config } from 'dotenv'
import { IncomingMessage, ServerResponse, createServer } from 'node:http'
import { MongoClient } from 'mongodb'
import { randomUUID } from 'node:crypto'

config()

const PORT = process.env.HTTP_SERVER_PORT

const client = new MongoClient(process.env.MONGODB_CONNECTION_URL)
const database = client.db('db')
const users = database.collection('users')
const orders = database.collection('orders')

const doc = { username: 'admin', password: '123' }

const createTestUser = async () => {
  console.log('Creating test user...')
  const result = await users.findOne(doc)
  if (!result) {
    await users.insertOne(doc)
    console.log('Inserted test user')
  }

  console.log('Test user exists')
}

createTestUser()

const connection = await amqp.connect('amqp://127.0.0.1:5672')
const channel = await connection.createChannel()

await channel.assertQueue('test-queue')

const httpServer = createServer()
const clients = new Map()

/**
 * @param {{ username:string, password:string }} data
 * @returns {Promise<boolean>}
 */
const verifyTestUser = async ({ username, password }) => {
  const user = await users.findOne({ username, password })
  return !!user
}

/**
 * @param {IncomingMessage} request
 */
const parsePostRequest = async (request) =>
  new Promise((resolve, reject) => {
    let postData = ''

    request.on('data', (data) => (postData += data))
    request.on('end', () => {
      try {
        const body = JSON.parse(postData)
        resolve(body)
      } catch (e) {
        reject(e)
      }
    })

    request.on('error', reject)
  })

/**
 * @param {IncomingMessage} request
 * @param {ServerResponse} response
 */
const handleSignInRequest = async (request, response) => {
  const body = await parsePostRequest(request)
  const user = await verifyTestUser(body)
  if (user) {
    response.statusCode = 200
    return response.end(JSON.stringify(body))
  }

  response.statusCode = 401
  return response.end()
}

/**
 * @param {IncomingMessage} request
 * @param {ServerResponse} response
 */
const handleOrderRequestListener = async (request, response) => {
  response.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })

  const ordersArray = await orders.find({}).toArray()

  const data = `data: ${JSON.stringify(ordersArray)}\n\n`

  const id = randomUUID()

  clients.set(id, response)

  response.write(data)

  request.on('close', () => clients.delete(id))
}

channel.consume('orders-queue', (data) => {
  const order = { ...JSON.parse(data.content), status: 'accepted' }

  orders.insertOne(order)
  const writeData = `data: ${JSON.stringify(order)}\n\n`

  clients.forEach((response) => response.write(writeData))

  channel.ackAll()
})

/**
 * @param {IncomingMessage} request
 * @param {ServerResponse} response
 */
const handleChangeOrderStatusRequest = async (request, response) => {
  const body = await parsePostRequest(request)
  const user = await verifyTestUser(body)

  if (!user) {
    response.statusCode = 401
    return response.end()
  }

  console.log(body)
}

const routes = new Map()

routes.set('/sign-in', handleSignInRequest)
routes.set('/orders', handleOrderRequestListener)
routes.set('/change-status', handleChangeOrderStatusRequest)

/**
 * @param {IncomingMessage} request
 * @param {ServerResponse} response
 */
const handleHTTPRequest = (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200')

  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')

  response.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')

  const method = routes.get(request.url)

  response.setHeader('Content-Type', 'application/json')

  if (!method) {
    response.statusCode = 404
    return response.end()
  }

  method(request, response)
}

httpServer.on('request', handleHTTPRequest)
httpServer.listen(PORT, () => console.log(`Server running in: http://127.0.0.1:${PORT}`))
