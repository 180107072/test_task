import { Component } from '@angular/core'
import { MatDialogRef } from '@angular/material/dialog'
import { FormControl } from '@angular/forms'

import { User } from '../../types/index'
import { UserService } from '../../services/user.servive'

@Component({
  selector: 'signin-dialog',
  templateUrl: './signin-dialog.component.html',
})
export class SigninDialogComponent {
  username = new FormControl('')
  password = new FormControl('')
  constructor(public dialogRef: MatDialogRef<SigninDialogComponent>, private userService: UserService) {}

  async onClick() {
    try {
      const response = await fetch('http://127.0.0.1:3000/sign-in', {
        method: 'post',
        body: JSON.stringify({ username: this.username.value, password: this.password.value }),
      })
      if (!response.ok) {
        console.log(response)
        return
      }

      const user = (await response.json()) as User

      this.userService.userSet(user)

      localStorage.setItem('user', JSON.stringify(user))
    } catch {}
  }
}
