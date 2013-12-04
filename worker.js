/*!
 * cnpmjs.org - worker.js 
 * Copyright(c) 2013 
 * Author: dead_horse <dead_horse@qq.com>
 */

'use strict';

/**
 * Module dependencies.
 */
var graceful = require('graceful');

var config = require('./config');
var server = require('./app');

server.listen(config.webPort);

graceful({
  server: [server],
  error: function (err, throwErrorCount) {
    if (err.message) {
      err.message += ' (uncaughtException throw ' + throwErrorCount + ' times on pid:' + process.pid + ')';
    }
    console.error(err);
  }
});
