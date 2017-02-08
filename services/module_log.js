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

const models = require('../models');
const ModuleLog = models.ModuleLog;

exports.create = function* (data) {
  const row = ModuleLog.build({
    name: data.name,
    username: data.username || 'anonymous',
    log: '',
  });
  return yield row.save();
};

const ONE_MB = 1024 * 1024;

exports.append = function* (id, log) {
  if (!log) {
    return null;
  }

  const row = yield exports.get(id);
  if (!row) {
    return null;
  }

  if (row.log) {
    row.log += '\n' + log;
  } else {
    row.log = log;
  }
  if (row.log.length >= ONE_MB) {
    row.log = '...\n' + row.log.substring(ONE_MB / 2);
  }
  return yield row.save([ 'log' ]);
};

exports.get = function* (id) {
  return yield ModuleLog.findById(id);
};
