/**!
 * cnpmjs.org - common/logger.js
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

var formater = require('error-formater');
var Logger = require('mini-logger');
var utility = require('utility');
var util = require('util');
var config = require('../config');
var mail = require('./mail');

var isTEST = process.env.NODE_ENV === 'test';
var categories = ['sync_info', 'sync_error'];

var logger = module.exports = Logger({
  categories: categories,
  dir: config.logdir,
  duration: '1d',
  format: '[{category}.]YYYY-MM-DD[.log]',
  stdout: config.debug && !isTEST,
  errorFormater: errorFormater
});

var to = [];
for (var user in config.admins) {
  to.push(config.admins[user]);
}

function errorFormater(err) {
  var msg = formater.both(err);
  mail.error(to, msg.json.name, msg.text);
  return msg.text;
}

logger.syncInfo = function () {
  var args = [].slice.call(arguments);
  if (typeof args[0] === 'string') {
    args[0] = util.format('[%s][%s] ', utility.logDate(), process.pid) + args[0];
  }
  logger.sync_info.apply(logger, args);
};

logger.syncError =function () {
  var args = [].slice.call(arguments);
  if (typeof args[0] === 'string') {
    args[0] = util.format('[%s][%s] ', utility.logDate(), process.pid) + args[0];
  }
  logger.sync_error.apply(logger, arguments);
};
