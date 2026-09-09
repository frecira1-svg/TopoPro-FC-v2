import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PuntosGeneral } from './puntos-general';

describe('PuntosGeneral', () => {
  let component: PuntosGeneral;
  let fixture: ComponentFixture<PuntosGeneral>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PuntosGeneral],
    }).compileComponents();

    fixture = TestBed.createComponent(PuntosGeneral);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
