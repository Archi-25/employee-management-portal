import { Directive, ElementRef, HostListener, inject, output } from '@angular/core';

/**
 * Emits when a click lands anywhere outside the host element.
 * Used to dismiss the row action menus on the employee table.
 */
@Directive({
  selector: '[appClickOutside]',
})
export class ClickOutsideDirective {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly appClickOutside = output<void>();

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node | null;
    if (target && !this.host.nativeElement.contains(target)) {
      this.appClickOutside.emit();
    }
  }
}
