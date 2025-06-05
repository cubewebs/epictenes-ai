import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DangerBtnComponent } from './danger-btn.component';

describe('DangerBtnComponent', () => {
  let component: DangerBtnComponent;
  let fixture: ComponentFixture<DangerBtnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DangerBtnComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DangerBtnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
