import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main-btn',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './main-btn.component.html',
  styleUrl: './main-btn.component.scss'
})
export class MainBtnComponent {
  @Input() label: string = 'Button';
  @Input() disabled: boolean = false;

  @Output() onClick = new EventEmitter<void>();

  handleClick() {
    this.onClick.emit();
  }
}
