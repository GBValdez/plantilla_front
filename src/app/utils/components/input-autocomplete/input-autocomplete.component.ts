import { ChangeDetectionStrategy } from '@angular/core';
import {
  Component,
  EventEmitter,
  Injector,
  Input,
  OnChanges,
  OnInit,
  Optional,
  Output,
  Self,
  SimpleChanges,
  forwardRef,
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormBuilder,
  FormControl,
  NG_VALUE_ACCESSOR,
  NgControl,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { catalogueInterface } from '@utils/commons.interface';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-input-autocomplete',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatAutocompleteModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  templateUrl: './input-autocomplete.component.html',
  styleUrl: './input-autocomplete.component.scss',
})
export class InputAutocompleteComponent
  implements OnInit, ControlValueAccessor, OnChanges
{
  constructor(
    private fb: FormBuilder,
    @Optional() @Self() private ngControl: NgControl,
  ) {
    if (this.ngControl) this.ngControl.valueAccessor = this;
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options'] && this.pendingValue !== undefined) {
      this.writeValue(this.pendingValue);
    }
    if (this.noFilter)
      if (changes['options']) {
        this.optionsFilter = this.options;
      }
  }

  form = new FormControl();
  currentValue: string = '';
  @Input() options: catalogueInterface[] = [];
  @Input() noFilter: boolean = false;
  @Output() noExistOptionEvent: EventEmitter<string> = new EventEmitter();
  @Output() writingEvent: EventEmitter<string> = new EventEmitter();
  @Output() selectedEvent: EventEmitter<catalogueInterface> =
    new EventEmitter();
  optionsFilter: catalogueInterface[] = [];

  showErrors() {}
  onTouch?: Function;
  onWrite?: Function;
  private pendingValue?: string | number;

  writeValue(value: string | number | catalogueInterface | null): void {
    const option =
      value && typeof value === 'object'
        ? value
        : this.options.find((option) => option.id == value);
    this.pendingValue =
      !option && value !== null && value !== '' && typeof value !== 'object'
        ? value
        : undefined;
    this.form.setValue(option ?? '', { emitEvent: false });
  }
  registerOnChange(fn: any): void {
    this.onWrite = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }
  setDisabledState?(isDisabled: boolean): void {
    if (isDisabled) this.form.disable();
    else this.form.enable();
  }

  ngOnInit(): void {
    if (this.ngControl?.control)
      this.form.setValidators(this.ngControl.control.validator!);
    this.form.updateValueAndValidity();
  }

  filter(event: FocusEvent | Event): void {
    if (event.type === 'input') this.pendingValue = undefined;
    setTimeout(() => {
      const value = (event.target as HTMLInputElement).value;
      this.writingEvent.emit(value);
      this.currentValue = value;
      const optConst: string | number | undefined = this.options.find(
        (opt) => opt.name.toLowerCase() === value.toLowerCase(),
      )?.id;
      if (optConst) {
        this.onWrite?.(optConst);
      } else {
        this.onWrite?.('');
        if (!this.noFilter)
          this.optionsFilter = this.options.filter((opt) =>
            opt.name.toLowerCase().includes(value.toLowerCase()),
          );
        else this.optionsFilter = this.options;
      }
    }, 10);
  }

  displayText(option: catalogueInterface): string {
    return option && option.name ? option.name : '';
  }

  noExistOption() {
    setTimeout(async () => {
      if (this.currentValue.trim().length == 0) return;
      const opt: catalogueInterface | undefined = this.options.find(
        (option) =>
          option.name.toLowerCase() == this.currentValue.toLowerCase(),
      );
      if (!opt) {
        this.noExistOptionEvent.emit(this.currentValue);
        this.form.patchValue('');
      } else {
        this.onWrite?.(opt.id);
      }
      this.onTouch?.();
    }, 70);
  }
  selected(event: MatAutocompleteSelectedEvent): void {
    this.pendingValue = undefined;
    this.onWrite?.(event.option.value);
    this.onTouch?.();
    this.selectedEvent.emit(event.option.value);
  }
}
