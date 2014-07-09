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
var config = require('../config');
var mail = require('./mail');

var isTEST = process.env.NODE_ENV === 'test';
var levels = ['info', 'warn', 'error'];

module.exports = Logger({
  dir: config.logdir,
  duration: '1d',
  format: '[{category}.]YYYY-MM-DD[.log]',
  stdout: config.debug && !isTEST,
  errorFormater: errorFormater
});

var to = [];
for (var name in config.admins) {
  to.push(config.admins[name]);
}

function errorFormater(err) {
  var msg = formater.both(err);
  mail.error(to, msg.json.name, msg.text);
  return msg.text;
}
