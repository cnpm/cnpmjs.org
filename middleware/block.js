/**!
 * cnpmjs.org - middleware/block.js
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

module.exports = function () {
  return function* block(next) {
    var ua = String(this.get('user-agent')).toLowerCase();
    if (ua === 'ruby') {
      this.status = 403;
      return this.body = {
        message: 'forbidden Ruby user-agent, ip: ' + this.ip
      };
    }
    yield* next;
  };
};
