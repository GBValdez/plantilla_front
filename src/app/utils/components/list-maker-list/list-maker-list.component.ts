import { ChangeDetectionStrategy } from '@angular/core';
import {
  Component,
  EventEmitter,
  Input,
  Optional,
  Output,
  Self,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  NgControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { catalogueInterface } from '@utils/commons.interface';
import { InputAutocompleteComponent } from '@utils/components/input-autocomplete/input-autocomplete.component';
import Swal from 'sweetalert2';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-list-maker-list',
  standalone: true,
  imports: [
    InputAutocompleteComponent,
    MatCardModule,
    MatIconModule,
    ReactiveFormsModule,
  ],
  templateUrl: './list-maker-list.component.html',
  styleUrl: './list-maker-list.component.scss',
})
export class ListMakerListComponent implements ControlValueAccessor {
  constructor(@Optional() @Self() private ngControl: NgControl) {
    if (this.ngControl) this.ngControl.valueAccessor = this;
  }
  onTouch?: Function;
  onWrite?: Function;
  inputControl = new FormControl();
  disabled = false;
  writeValue(value: (catalogueInterface | string | number)[] | null): void {
    this.itemsSelected = (value ?? []).map((item) =>
      typeof item === 'object'
        ? item
        : (this.listOpt.find((option) => option.id === item) ?? {
            id: item,
            name: String(item),
            description: '',
          }),
    );
  }
  setDisabledState(disabled: boolean): void {
    this.disabled = disabled;
    disabled ? this.inputControl.disable() : this.inputControl.enable();
  }
  registerOnChange(fn: any): void {
    this.onWrite = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }
  // setDisabledState?(isDisabled: boolean): void {
  //   throw new Error('Method not implemented.');
  // }
  @Output() foundingEvent: EventEmitter<string> = new EventEmitter();
  @Output() noExistOptionEvent: EventEmitter<string> = new EventEmitter();
  @Input() listOpt: catalogueInterface[] = [];
  @Input() isLocal: boolean = false;

  founding(value: string): void {
    this.foundingEvent.emit(value);
  }
  noExistOption(value: string): void {
    if (!this.isLocal) return;

    this.noExistOptionEvent.emit(value);
  }

  itemsSelected: catalogueInterface[] = [];
  removeItem(item: catalogueInterface): void {
    if (this.disabled) return;
    this.onTouch?.();
    this.itemsSelected = this.itemsSelected.filter((el) => el.id !== item.id);
    this.onWrite?.(this.itemsSelected.map((el) => el.id));
  }

  addItems(item: catalogueInterface): void {
    if (this.disabled) return;
    this.onTouch?.();
    this.inputControl.patchValue('');
    if (this.itemsSelected.some((el) => el.id === item.id)) {
      Swal.fire('Error', 'El item ya esta en la lista', 'error');
      return;
    }
    this.itemsSelected = [...this.itemsSelected, item];
    this.onWrite?.(this.itemsSelected.map((el) => el.id));
  }
}
