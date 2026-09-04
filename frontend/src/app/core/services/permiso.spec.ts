import { TestBed } from '@angular/core/testing';

import { Permiso } from './permiso';

describe('Permiso', () => {
  let service: Permiso;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Permiso);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
