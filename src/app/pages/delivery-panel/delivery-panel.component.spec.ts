import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliveryPanelComponent } from './delivery-panel.component';

describe('DeliveryPanelComponent', () => {
  let component: DeliveryPanelComponent;
  let fixture: ComponentFixture<DeliveryPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeliveryPanelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeliveryPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
