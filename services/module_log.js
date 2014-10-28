/**!
 * cnpmjs.org - services/module_log.js
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

var models = require('../models');
var ModuleLog = models.ModuleLog;

exports.create = function* (data) {
  var row = ModuleLog.build({
    name: data.name,
    username: data.username || 'anonymous',
    log: ''
  });
  return yield row.save();
};

exports.append = function* (id, log) {
  if (!log) {
    return null;
  }

  var row = yield* exports.get(id);
  if (!row) {
    return null;
  }
  row.log += '\n' + log;
  return yield row.save(['log']);
};

exports.get = function* (id) {
  return yield ModuleLog.find(Number(id));
};
