import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Input,
  OnInit,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Observable } from 'rxjs';
import { sideMenuInterfaceInternal } from '../../side-menu.interface';
@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-sub-level',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './sub-level.component.html',
  styleUrl: './sub-level.component.css',
})
export class SubLevelComponent implements OnInit {
  private readonly destroy = inject(DestroyRef);
  private readonly router = inject(Router);
  @Input() buttons: sideMenuInterfaceInternal[] = [];
  @Input() showElementsObs?: Observable<boolean>;
  @Input() collapseObs?: Observable<boolean>;
  @Input() level = 0;
  showElements = false;
  collapse = true;
  private buttonOpenedChildren?: sideMenuInterfaceInternal;
  ngOnInit(): void {
    this.showElementsObs
      ?.pipe(takeUntilDestroyed(this.destroy))
      .subscribe((value) => (this.showElements = value));
    this.collapseObs
      ?.pipe(takeUntilDestroyed(this.destroy))
      .subscribe((value) => (this.collapse = value));
  }
  visible(button: sideMenuInterfaceInternal): boolean {
    return button.show ?? !!button.child?.some((child) => this.visible(child));
  }
  link(button: sideMenuInterfaceInternal): string {
    return typeof button.click === 'string' ? button.click : '';
  }
  active(button: sideMenuInterfaceInternal): boolean {
    return this.link(button)
      ? this.router.url.startsWith(this.link(button))
      : !!button.child?.some((child) => this.active(child));
  }
  action(button: sideMenuInterfaceInternal): void {
    if (typeof button.click === 'string')
      void this.router.navigate([button.click]);
    if (typeof button.click === 'function') button.click();
    if (!button.child) return;
    if (button.openChild) {
      button.openChild = false;
      this.buttonOpenedChildren = undefined;
    } else {
      if (this.buttonOpenedChildren)
        this.buttonOpenedChildren.openChild = false;
      button.openChild = true;
      this.buttonOpenedChildren = button;
    }
  }
}
