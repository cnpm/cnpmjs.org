/**!
 * list packages by username
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <m@fengmk2.com> (http://fengmk2.com)
 */

'use strict';

/**
 * Module dependencies.
 */

const packageService = require('../../../services/package');

module.exports = function*() {
  const username = this.params.user;
  const packages = yield packageService.listModulesByUser(username);

  this.body = {
    user: {
      name: username,
    },
    packages: packages,
  };
};
