'use strict';

module.exports = function* showSync() {
  var name = this.params.name || this.params[0] || this.query.name;
  if (!name) {
    return this.redirect('/');
  }
  var type = 'package';
  if (name.indexOf(':') > 0) {
    var splits = name.split(':');
    name = splits[1];
    type = splits[0];
  }
  yield this.render('sync', {
    type: type,
    name: name,
    title: 'Sync ' + type + ' - ' + name,
  });
};
