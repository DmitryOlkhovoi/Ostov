// Utilities used only in the test suite, not part of the production build.
// Extends the global _ (from utils.js) with test-only helpers.

_.bind = function(fn, context) {
  var args = Array.prototype.slice.call(arguments, 2);
  return function() {
    return fn.apply(context, args.concat(Array.prototype.slice.call(arguments)));
  };
};

_.debounce = function(fn, wait, immediate) {
  var timeout;
  return function() {
    var ctx = this, args = arguments;
    var later = function() {
      timeout = null;
      if (!immediate) fn.apply(ctx, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) fn.apply(ctx, args);
  };
};
