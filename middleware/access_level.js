'use strict';


function require_level(level) {
  return function* access_level(next) {
    if (this.user.role >= level || this.user.id === 0) {
      yield *next;
    } else {
      this.status = 401;
      this.set('WWW-Authenticate', 'Basic realm="sample"');
    }
  }
};

exports.require_admin = require_level(1);

