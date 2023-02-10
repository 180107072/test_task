export type User = {
  username: string
  password: string
}

export type OrderStatus = 'accepted' | 'preparing' | 'delivery' | 'delivered' | 'canceled'

export type Order = {
  _id: string
  channel: string
  avatar: string
  name: string
  pizza: string
  size: string
  dough: string
  side: string
  additives: string
  status: OrderStatus
}
