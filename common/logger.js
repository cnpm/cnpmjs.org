/*!
 * cnpmjs.org - common/logger.js
 * Copyright(c) 2013 
 * Author: dead_horse <undefined>
 */

'use strict';

/**
 * Module dependencies.
 */

var config = require('../config');
var util = require('util');
var moment = require('moment');
var logstream = require('logfilestream');
var ms = require('ms');

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
    if (msg instanceof Error) {
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
      if (config.debug) {
        var level = catetory;
        console.log('[' + level + '] ' + msg);
      } else {
        stream.write(msg);
      }
    }
  }
  exports[catetory] = write;
});
