import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-danger-btn',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './danger-btn.component.html',
  styleUrl: './danger-btn.component.scss'
})
export class DangerBtnComponent {
  @Input() label: string = 'Button';
  @Input() disabled: boolean = false;

  @Output() onClick = new EventEmitter<void>();

  handleClick() {
    if (!this.disabled) {
        this.onClick.emit();
    }
  }
}
