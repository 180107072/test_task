import { Component } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { UserService } from './services/user.servive'
import { SigninDialogComponent } from './components/dialog/signin-dialog.component'
import { Order, User } from './types'
import { OrdersService } from './services/orders.service'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent {
  title = 'admin-client'

  constructor(
    public dialog: MatDialog,
    private userService: UserService,
    private ordersService: OrdersService
  ) {
    this.openDialog(0, 0)

    const sseSource = new EventSource('http://127.0.0.1:3000/orders')

    sseSource.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (Array.isArray(data)) {
        this.ordersService.orderSet(data as Order[])
      } else {
        this.ordersService.orderAdd(data as Order)
      }
    }

    this.userService.userChange.subscribe((value) => {
      if (value && value.username && value.password) {
        return this.dialog.closeAll()
      }
      this.openDialog(0, 0)
    })
  }

  logout() {
    localStorage.removeItem('user')
    this.userService.userSet(null)
  }

  openDialog(enterAnimationDuration: number, exitAnimationDuration: number): void {
    this.dialog.open(SigninDialogComponent, {
      width: '250px',
      height: '400px',
      disableClose: true,
      enterAnimationDuration,
      exitAnimationDuration,
    })
  }
}
