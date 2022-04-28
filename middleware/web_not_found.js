'use strict';

var debug = require('debug')('cnpmjs.org:middleware:web_not_found');

module.exports = function* notFound(next) {
  yield next;

  if (this.status && this.status !== 404) {
    return;
  }
  if (this.body) {
    return;
  }

  var m = /^\/([\w\-\.]+)\/?$/.exec(this.path);
  if (!m) {
    // scoped packages
    m = /^\/(@[\w\-\.]+\/[\w\-\.]+)$/.exec(this.path);
  }
  debug('%s match %j', this.url, m);
  if (m) {
    return this.redirect('/package/' + m[1]);
  }

  // package not found
  m = /^\/package\/([\w\-\_\.]+)\/?$/.exec(this.path);
  if (!m) {
    // scoped packages
    m = /^\/package\/(@[\w\-\.]+\/[\w\-\.]+)$/.exec(this.path);
    // maybe encode url: /package/%40foo%2Fawdawda
    if (!m && this.path.startsWith('/package/%40')) {
      m = /^\/package\/(@[\w\-\.]+\/[\w\-\.]+)$/.exec(decodeURIComponent(this.path));
    }
  }
  var name = null;
  var title = '404: Page Not Found';
  if (m) {
    name = m[1];
    title = name + ' Not Found';
  }

  this.status = 404;
  yield this.render('404', {
    title: title,
    name: name
  });
};
