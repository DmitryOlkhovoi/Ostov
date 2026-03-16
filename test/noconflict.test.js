import { describe, it, expect } from 'vitest';

describe('Backbone.noConflict', () => {

  it('noConflict', () => {
    var noconflictBackbone = Backbone.noConflict();
    expect(window.Backbone).toBe(undefined);
    window.Backbone = noconflictBackbone;
    expect(window.Backbone).toBe(noconflictBackbone);
  });

});
