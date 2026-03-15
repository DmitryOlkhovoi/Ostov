(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('backbone')) :
  typeof define === 'function' && define.amd ? define(['backbone'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, (global.Backbone = global.Backbone || {}, global.Backbone.debugInfo = factory(global.Backbone)));
})(this, (function (Backbone) {
  // Provide useful information when things go wrong.
  function debugInfo() {
    // Introspect Backbone.
    var _b = Backbone._debug(), _ = _b._, root = _b.root;
    // Backbone now uses its own built-in utils instead of underscore/lodash.
    var info = {
      backbone: Backbone.VERSION,
      // Is this the exact released version, or a later development version?
      /* This is automatically temporarily replaced when publishing a release,
         so please don't edit this. */
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
    /* eslint-disable-next-line no-console */
    console.debug('Backbone debug info: ', JSON.stringify(info, null, 4));
    return info;
  }

  return debugInfo;

}));
