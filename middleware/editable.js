/**!
 * cnpmjs.org - middleware/editable.js
 *
 * Copyright(c) fengmk2 and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var packageService = require('../services/package');

// admin or module's maintainer can modified the module
module.exports = function* editable(next) {
  var username = this.user && this.user.name;
  var moduleName = this.params.name || this.params[0];
  if (username && moduleName) {
    if (this.user.isAdmin) {
      return yield* next;
    }
    var isMaintainer = yield* packageService.isMaintainer(moduleName, username);
    if (isMaintainer) {
      return yield* next;
    }
  }

  this.status = 403;
  var message = 'not authorized to modify ' + moduleName;
  if (username) {
    message = username + ' ' + message;
  }
  this.body = {
    error: 'forbidden user',
    reason: message
  };
};
