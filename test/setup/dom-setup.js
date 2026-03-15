['qunit', 'qunit-fixture'].forEach(function(id) {
  if (!document.getElementById(id)) {
    var el = document.createElement('div');
    el.id = id;
    document.body.appendChild(el);
  }
});
