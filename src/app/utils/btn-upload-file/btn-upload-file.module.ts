import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BtnUploadFileDirective } from './btn-upload-file.directive';

@NgModule({
  imports: [CommonModule, BtnUploadFileDirective],
  exports: [BtnUploadFileDirective],
})
export class BtnUploadFileModule {}
