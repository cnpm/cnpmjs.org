'use strict';

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

var ONE_MB = 1024 * 1024;

exports.append = function* (id, log) {
  if (!log) {
    return null;
  }

  var row = yield exports.get(id);
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
  return yield row.save(['log']);
};

exports.get = function* (id) {
  return yield ModuleLog.findById(id);
};
