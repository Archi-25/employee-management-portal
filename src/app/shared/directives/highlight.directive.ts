import {
  Directive,
  ElementRef,
  HostBinding,
  HostListener,
  OnChanges,
  Renderer2,
  inject,
  Input,
} from '@angular/core';

/**
 * MODULE 2 — `Renderer2` + `@HostListener` + `@HostBinding` in one directive.
 *
 * `Renderer2` is used rather than `nativeElement.style` so the same code runs
 * under SSR, in a web worker, or with a hardened DOM — the renderer abstracts
 * the platform away.
 */
@Directive({
  selector: '[appHighlight]',
})
export class HighlightDirective implements OnChanges {
  private readonly renderer = inject(Renderer2);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Background applied on hover. */
  @Input('appHighlight') color = '#eef2ff';
  /** Optional label rendered into a `data-*` attribute via Renderer2. */
  @Input() highlightLabel = '';

  /** `@HostBinding` writes straight onto the host element's property/attribute. */
  @HostBinding('class.is-highlighted') isHighlighted = false;
  @HostBinding('attr.tabindex') readonly tabIndex = '0';
  @HostBinding('style.transition') readonly transition = 'background-color 140ms ease';

  ngOnChanges(): void {
    if (this.highlightLabel) {
      this.renderer.setAttribute(this.host.nativeElement, 'data-highlight', this.highlightLabel);
    } else {
      this.renderer.removeAttribute(this.host.nativeElement, 'data-highlight');
    }
  }

  @HostListener('mouseenter')
  @HostListener('focus')
  onEnter(): void {
    this.isHighlighted = true;
    this.renderer.setStyle(this.host.nativeElement, 'background-color', this.color);
  }

  @HostListener('mouseleave')
  @HostListener('blur')
  onLeave(): void {
    this.isHighlighted = false;
    this.renderer.removeStyle(this.host.nativeElement, 'background-color');
  }

  /** Host listeners can read the DOM event and cancel it. */
  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.onLeave();
    }
  }
}
