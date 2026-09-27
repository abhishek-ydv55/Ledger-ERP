import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="p-6"><h1 class="text-3xl font-bold text-slate-800">Payments & Allocations</h1></div>`
})
export class PaymentsComponent {}
