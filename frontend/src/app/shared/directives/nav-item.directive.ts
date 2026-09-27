import { Directive, ElementRef, inject } from '@angular/core';
import { FocusableOption } from '@angular/cdk/a11y';

@Directive({
  selector: '[appNavItem]',
  standalone: true
})
export class NavItemDirective implements FocusableOption {
  readonly elementRef = inject(ElementRef<HTMLElement>);

  focus(): void {
    this.elementRef.nativeElement.focus();
  }
}
