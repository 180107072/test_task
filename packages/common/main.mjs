import amqp from 'amqplib'

export const connectionConfig = {
  exchange: 'example-exchange',
  queues: [
    { name: 'example-queue', key: 'orders' },
    { name: 'example-status-queue', key: 'statuses' },
  ],
}

export async function createConnection() {
  const connection = await amqp.connect('amqp://127.0.0.1:5672')
  const channel = await connection.createChannel()

  await channel.assertExchange(connectionConfig.exchange, 'direct', { durable: true })

  for await (const { name, key } of connectionConfig.queues) {
    await channel.assertQueue(name, { durable: true })
    await channel.bindQueue(name, connectionConfig.exchange, key)
  }

  await channel.prefetch(1)

  return channel
}
