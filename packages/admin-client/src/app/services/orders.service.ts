import { Injectable } from '@angular/core'
import { BehaviorSubject, Subject } from 'rxjs'
import { Order, User } from '../types'

@Injectable()
export class OrdersService {
  orderChange = new BehaviorSubject<Order[]>([])

  constructor() {}

  orderSet(orders: Order[]) {
    this.orderChange.next(orders)
  }

  orderAdd(order: Order) {
    this.orderChange.next([...this.orderChange.getValue(), order])
  }
}
