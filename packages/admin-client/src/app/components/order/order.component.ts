import { Component, NgZone } from '@angular/core'
import { Observable } from 'rxjs'
import { OrdersService } from 'src/app/services/orders.service'
import { Order, OrderStatus } from 'src/app/types'

@Component({
  selector: 'order',
  templateUrl: './order.component.html',
})
export class OrderComponent {
  statuses: OrderStatus[] = ['accepted', 'preparing', 'delivery', 'delivered', 'canceled']
  orders: Order[] = []

  constructor(private ordersService: OrdersService, private ngZone: NgZone) {}

  ngOnInit() {
    this.ordersService.orderChange.subscribe((value) => {
      this.ngZone.run(() => (this.orders = value))
    })
  }
}
