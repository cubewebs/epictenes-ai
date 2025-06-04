import { Component } from '@angular/core';
import { MainLayoutComponent } from './views/main-layout/main-layout.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ MainLayoutComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'epictenes-angular';
}
