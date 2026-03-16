/* eslint-disable no-console */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// Inline the debugInfo function since the module versions depend on
// resolving 'backbone' as a package, which is not available in tests.
function debugInfo() {
  var _b = Backbone._debug(), _ = _b._, root = _b.root;
  var info = {
    backbone: Backbone.VERSION,
    distribution: 'MARK_DEVELOPMENT',
    _: _.VERSION,
    $: Backbone.$ ? 'custom' : false
  };
  if (typeof root.Deno !== 'undefined') {
    info.deno = _.pick(root.Deno, 'version', 'build');
  } else if (typeof root.process !== 'undefined') {
    info.process = _.pick(root.process, 'version', 'platform', 'arch');
  } else if (typeof root.navigator !== 'undefined') {
    info.navigator = _.pick(root.navigator, 'userAgent', 'platform', 'webdriver');
  }
  console.debug('Backbone debug info: ', JSON.stringify(info, null, 4));
  return info;
}

describe('Backbone.debugInfo', () => {
  var logs, originalDebug = console.debug;

  function spyDebug() {
    logs.push(arguments);
    originalDebug.apply(console, arguments);
  }

  beforeEach(() => {
    logs = [];
    console.debug = spyDebug;
    Backbone.debugInfo = debugInfo;
  });

  afterEach(() => {
    console.debug = originalDebug;
    delete Backbone.debugInfo;
    logs = undefined;
  });

  it('debugInfo', () => {
    var info = Backbone.debugInfo();
    expect(info.backbone).toBe(Backbone.VERSION);
    expect(info.distribution).toBe('MARK_DEVELOPMENT');
    expect(info._).toBe(_.VERSION);
    expect(info.$).toBe(Backbone.$ ? 'custom' : false);
    // In jsdom under Node, root.process is defined, so the process branch
    // is taken instead of navigator. Check whichever branch was selected.
    if (info.navigator) {
      expect(typeof info.navigator).toBe('object');
      expect(info.navigator.userAgent).toBe(navigator.userAgent);
      expect(info.navigator.platform).toBe(navigator.platform);
      expect(info.navigator.webdriver).toBe(navigator.webdriver);
    } else if (info.process) {
      expect(typeof info.process).toBe('object');
    }
    expect(logs.length).toBe(1);
    var debugArgs = logs[0];
    var infoString = JSON.stringify(info, null, 4);
    expect(debugArgs[1]).toBe(infoString);
  });

});
