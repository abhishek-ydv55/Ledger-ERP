import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-banking',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="p-6"><h1 class="text-3xl font-bold text-slate-800">Bank Accounts & Transactions</h1></div>`
})
export class BankingComponent {}
