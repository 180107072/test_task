import slackBolt from '@slack/bolt'
import amqp from 'amqplib'
import { readFileSync } from 'node:fs'
import { config } from 'dotenv'

const { App } = slackBolt
const default_form = JSON.parse(readFileSync('./default_form.json'))

config()

const SLACK_BOT_PORT = process.env.SLACK_BOT_PORT

const connection = await amqp.connect('amqp://127.0.0.1:5672')
const channel = await connection.createChannel()

const app = new App({
  token: process.env.SLACK_TOKEN,
  signingSecret: process.env.SLACK_SECRET,
  appToken: process.env.SLACK_APP_TOKEN,
  port: SLACK_BOT_PORT,
  socketMode: true,
})

const exchange = 'example-exchange'
const ordersQueue = 'example-queue'
const statusQueue = 'example-status-queue'

await channel.assertExchange(exchange, 'direct', { durable: true })
await channel.assertQueue(ordersQueue, { durable: true })
await channel.assertQueue(statusQueue, { durable: true })
await channel.bindQueue(ordersQueue, exchange, 'orders')
await channel.bindQueue(statusQueue, exchange, 'statuses')

await app.start()
console.log(`⚡️ Slack Bolt app is running on port ${SLACK_BOT_PORT}!`)

app.event('message', async (chat) => {
  app.client.chat.postMessage({
    channel: chat.message.channel,
    blocks: default_form,
  })
})

app.action({ action_id: 'order' }, async ({ ack }) => await ack())

app.action({ block_id: 'submit' }, async ({ body, say, ack }) => {
  const data = {}
  const user = await app.client.users.profile.get({
    include_labels: true,
    user: body.user.id,
  })

  for (const [k, { order }] of Object.entries(body.state.values)) {
    if (!order.selected_option) return await say('Вы не заполнили все поля!')
    data[k] = order.selected_option.value
  }

  channel.publish(
    exchange,
    'orders',
    Buffer.from(
      JSON.stringify({
        avatar: user.profile.image_48,
        name: user.profile.real_name,
        channel: body.channel.id,
        ...data,
      })
    )
  )

  await ack()
})

const statuses = {
  accepted: 'Принято',
  preparing: 'Готовим',
  delivery: 'Доставляем',
  delivered: 'Доставлен',
  canceled: 'Отмена',
}

channel.consume(statusQueue, async (data) => {
  console.log('STATUS CHANGE')
  const { status, channel } = JSON.parse(data.content)

  app.client.chat.postMessage({
    channel,
    text: statuses[status] || 'error',
  })
})
