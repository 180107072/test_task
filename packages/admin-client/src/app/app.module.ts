import { ChangeDetectorRef, NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'

import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MatNativeDateModule } from '@angular/material/core'
import { HttpClientModule } from '@angular/common/http'
import { AppComponent } from './app.component'
import { MaterialExampleModule } from './modules/material.module'
import { UserService } from './services/user.servive'
import { SigninDialogComponent } from './components/dialog/signin-dialog.component'
import { OrderComponent } from './components/order/order.component'
import { OrdersService } from './services/orders.service'

@NgModule({
  declarations: [AppComponent, SigninDialogComponent, OrderComponent],
  imports: [
    BrowserAnimationsModule,
    BrowserModule,
    FormsModule,
    HttpClientModule,
    MatNativeDateModule,
    ReactiveFormsModule,
    MaterialExampleModule,
  ],

  providers: [UserService, OrdersService],
  bootstrap: [AppComponent],
})
export class AppModule {}
