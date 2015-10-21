/**!
 * list package's dependents
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
  const name = this.params.name || this.params[0];
  const dependents = yield packageService.listDependents(name);

  this.body = {
    dependents: dependents,
  };
};
