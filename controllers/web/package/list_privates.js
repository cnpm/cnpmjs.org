/**!
 * cnpmjs.org - controllers/web/package/list_privates.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

const packageService = require('../../../services/package');
const config = require('../../../config');

module.exports = function* listPrivates() {
  const tasks = {};
  for (let i = 0; i < config.scopes.length; i++) {
    const scope = config.scopes[i];
    tasks[scope] = packageService.listPrivateModulesByScope(scope);
  }

  if (config.privatePackages && config.privatePackages.length > 0) {
    tasks['no scoped'] = packageService.listModules(config.privatePackages);
  }

  const scopes = yield tasks;
  yield this.render('private', {
    title: 'private packages',
    scopes,
  });
};
