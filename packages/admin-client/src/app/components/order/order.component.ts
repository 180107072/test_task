import { Component, NgZone } from '@angular/core'
import { Observable } from 'rxjs'
import { OrdersService } from 'src/app/services/orders.service'
import { UserService } from 'src/app/services/user.servive'
import { Order, OrderStatus } from 'src/app/types'

@Component({
  selector: 'order',
  templateUrl: './order.component.html',
})
export class OrderComponent {
  statuses: OrderStatus[] = ['accepted', 'preparing', 'delivery', 'delivered', 'canceled']
  orders: Order[] = []

  constructor(
    private ordersService: OrdersService,
    private ngZone: NgZone,
    private userServer: UserService
  ) {}

  ngOnInit() {
    this.ordersService.orderChange.subscribe((value) => {
      this.ngZone.run(() => (this.orders = value))
    })
  }

  async onStatusChange(currentOrder: Order, status: OrderStatus) {
    const user = this.userServer.userChange.getValue()

    const response = await fetch('http://127.0.0.1:3000/change-status', {
      method: 'post',
      body: JSON.stringify({
        ...user,
        ...{ id: currentOrder._id, channel: currentOrder.channel, status },
      }),
    })

    if (response.ok) {
      const updated = this.ordersService.orderChange
        .getValue()
        .map((order) => (order._id === currentOrder._id ? { ...order, status } : order))
      this.ordersService.orderSet(updated)
    }
  }
}
