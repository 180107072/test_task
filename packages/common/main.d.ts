declare module '@flow/common' {
  type Queue = {
    name: string
    key: string
  }
  export const createConnection: () => Promise<void>

  export const connectionConfig: {
    exchange: string
    queues: Queue[]
  }
}
