import slackBolt from '@slack/bolt'
import { readFileSync } from 'node:fs'
import { config } from 'dotenv'
import { createConnection, connectionConfig } from '@flow/common'

const {
  exchange,
  queues: [ordersQueue, statusQueue],
} = connectionConfig

const channel = await createConnection()
const { App } = slackBolt
const default_form = JSON.parse(readFileSync('./default_form.json'))

config()

const SLACK_BOT_PORT = process.env.SLACK_BOT_PORT

const app = new App({
  token: process.env.SLACK_TOKEN,
  signingSecret: process.env.SLACK_SECRET,
  appToken: process.env.SLACK_APP_TOKEN,
  port: SLACK_BOT_PORT,
  socketMode: true,
})

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
    ordersQueue.key,
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

channel.consume(statusQueue.name, async (data) => {
  const response = JSON.parse(data.content)

  app.client.chat.postMessage({
    channel: response.channel,
    text: statuses[response.status] || 'error',
  })

  try {
    channel.ack(data)
  } catch (err) {
    console.error(`Error processing message: ${err}`)

    channel.nack(data, false, false)
  }
})
