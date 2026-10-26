import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '@auth/services/auth.service';
import { BehaviorSubject } from 'rxjs';
import { sideMenuInterface } from './side-menu.interface';
import { SubLevelComponent } from './components/sub-level/sub-level.component';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-side-menu',
  standalone: true,
  imports: [MatIconModule, SubLevelComponent],
  templateUrl: './side-menu.component.html',
  styleUrl: './side-menu.component.css',
})
export class SideMenuComponent implements OnInit {
  private readonly destroy = inject(DestroyRef);
  private timeOut?: ReturnType<typeof setTimeout>;
  private restoringFocus = false;
  @ViewChild('navigation') private navigation?: ElementRef<HTMLElement>;
  readonly collapse = new BehaviorSubject(true);
  readonly showElements = new BehaviorSubject(false);
  collapseValue = true;
  showElementsValue = false;
  gmail = '';
  @Input() buttons: sideMenuInterface[] = [];
  @Output() collapseEvent = new EventEmitter<boolean>();
  constructor(private auth: AuthService) {
    this.destroy.onDestroy(() => clearTimeout(this.timeOut));
  }
  ngOnInit(): void {
    this.auth
      .getObservable()
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe((user) => (this.gmail = user?.email ?? ''));
  }
  noCollapseMenu(): void {
    if (!this.collapseValue) return;
    this.collapseValue = false;
    this.collapse.next(false);
    this.collapseEvent.emit(false);
    this.timeOut = setTimeout(() => {
      this.showElementsValue = true;
      this.showElements.next(true);
    }, 150);
  }
  collapseMenu(): void {
    const nav = this.navigation?.nativeElement;
    const focused = nav?.ownerDocument.activeElement;
    if (focused && nav?.contains(focused) && focused.closest('.children')) {
      this.restoringFocus = true;
      nav.focus({ preventScroll: true });
      this.restoringFocus = false;
    }
    clearTimeout(this.timeOut);
    this.collapseValue = true;
    this.showElementsValue = false;
    this.collapse.next(true);
    this.showElements.next(false);
    this.collapseEvent.emit(true);
  }
  pointerEnter(event: PointerEvent): void {
    if (event.pointerType === 'mouse') this.noCollapseMenu();
  }
  pointerLeave(event: PointerEvent): void {
    if (event.pointerType === 'mouse') this.collapseMenu();
  }
  focusOut(event: FocusEvent): void {
    if (
      !(event.currentTarget as HTMLElement).contains(
        event.relatedTarget as Node | null,
      )
    )
      this.collapseMenu();
  }
  focusIn(event: FocusEvent): void {
    if (
      !this.restoringFocus &&
      !(event.target as HTMLElement).closest('.menu-toggle')
    )
      this.noCollapseMenu();
  }
  toggle(): void {
    this.collapseValue ? this.noCollapseMenu() : this.collapseMenu();
  }
  getObsColapse() {
    return this.collapse.asObservable();
  }
  getObsShowElements() {
    return this.showElements.asObservable();
  }
}
