import { Injectable } from '@angular/core'
import { BehaviorSubject, Subject } from 'rxjs'
import { User } from '../types'

@Injectable()
export class UserService {
  userChange = new BehaviorSubject<User | null>(null)

  constructor() {
    try {
      const user = localStorage.getItem('user')
      if (user) this.userSet(JSON.parse(user) as User)
    } catch {
      console.log('err')
    }
  }

  userSet(user: User | null) {
    this.userChange.next(user)
  }
}
