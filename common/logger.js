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

var util = require('util');
var moment = require('moment');
var logstream = require('logfilestream');
var ms = require('ms');
var config = require('../config');
var mail = require('./mail');

var isTEST = process.env.NODE_ENV === 'test';
var ONE_DAY = ms('1d');
var levels = ['info', 'warn', 'error'];

levels.forEach(function (catetory) {
  var options = {
    logdir: config.logdir,
    duration: ONE_DAY,
    nameformat: '[' + catetory + '.]YYYY-MM-DD[.log]'
  };
  var stream = logstream(options);
  function write(msg) {
    var time = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    var subject = null;
    if (msg instanceof Error) {
      subject = msg.name;
      var err = {
        name: msg.name,
        code: msg.code,
        message: msg.message,
        stack: msg.stack,
        host: msg.host,
        url: msg.url,
        data: msg.data
      };
      if (err.name === 'Error' && typeof err.code === 'string') {
        err.name = err.code + err.name;
      }
      err.name += 'Exception';
      if (err.host) {
        err.message += ' (' + err.host + ')';
      }
      msg = util.format('%s nodejs.%s: %s\nURL: %s\nData: %j\n%s\n\n',
        time,
        err.name,
        err.stack,
        err.url,
        err.data,
        time
      );
    } else {
      msg = time + ' ' + util.format.apply(util, arguments) + '\n';
    }

    if (!isTEST) {
      stream.write(msg);
      if (config.debug) {
        var level = catetory;
        console.log('[' + level + '] ' + msg);
      } else {
        if (catetory === 'error' && subject) {
          // send error email
          var to = [];
          for (var name in config.admins) {
            to.push(config.admins[name]);
          }
          mail.error(to, subject, msg);
        }
      }
    }
  }
  exports[catetory] = write;
});
