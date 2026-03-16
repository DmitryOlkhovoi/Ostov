import { describe, it, expect } from 'vitest';

describe('Ostov.noConflict', () => {

  it('noConflict', () => {
    var noconflictBackbone = Ostov.noConflict();
    expect(window.Ostov).toBe(undefined);
    window.Ostov = noconflictBackbone;
    expect(window.Ostov).toBe(noconflictBackbone);
  });

});
