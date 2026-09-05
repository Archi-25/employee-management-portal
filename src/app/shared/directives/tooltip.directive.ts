import {
  Directive,
  ElementRef,
  HostBinding,
  HostListener,
  OnDestroy,
  Renderer2,
  inject,
  input,
} from '@angular/core';

let tooltipSeq = 0;

/**
 * Accessible tooltip: `<span [appTooltip]="'On parental leave'">`.
 *
 * Built with `Renderer2` rather than `nativeElement.innerHTML` so the same code
 * runs under server-side rendering, and so the label can never be interpreted
 * as markup.
 */
@Directive({
  selector: '[appTooltip]',
})
export class TooltipDirective implements OnDestroy {
  private readonly renderer = inject(Renderer2);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly appTooltip = input.required<string>();

  private readonly tooltipId = `tooltip-${++tooltipSeq}`;
  private bubble: HTMLElement | null = null;

  /** Host bindings keep the element keyboard-reachable and correctly labelled. */
  @HostBinding('attr.tabindex') readonly tabIndex = '0';
  @HostBinding('class.has-tooltip') readonly hasTooltip = true;
  @HostBinding('attr.aria-describedby') describedBy: string | null = null;

  @HostListener('mouseenter')
  @HostListener('focus')
  show(): void {
    if (this.bubble || !this.appTooltip()) {
      return;
    }

    const bubble = this.renderer.createElement('span') as HTMLElement;
    this.renderer.addClass(bubble, 'tooltip-bubble');
    this.renderer.setAttribute(bubble, 'id', this.tooltipId);
    this.renderer.setAttribute(bubble, 'role', 'tooltip');
    // setProperty on textContent — never innerHTML.
    this.renderer.setProperty(bubble, 'textContent', this.appTooltip());
    this.renderer.appendChild(this.host.nativeElement, bubble);

    this.bubble = bubble;
    this.describedBy = this.tooltipId;
  }

  @HostListener('mouseleave')
  @HostListener('blur')
  @HostListener('document:keydown.escape')
  hide(): void {
    if (!this.bubble) {
      return;
    }
    this.renderer.removeChild(this.host.nativeElement, this.bubble);
    this.bubble = null;
    this.describedBy = null;
  }

  ngOnDestroy(): void {
    this.hide();
  }
}
