/*!
 * cnpmjs.org - worker.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  dead_horse <dead_horse@qq.com>
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var graceful = require('graceful');

var config = require('./config');
var registry = require('./servers/registry');
var web = require('./servers/web');

registry.listen(config.registryPort);
web.listen(config.webPort);

console.log('[%s] [worker:%d] Server started, registry server listen at %d, web listen at %d, cluster: %s',
  new Date(), process.pid,
  config.registryPort, config.webPort, config.enableCluster);

graceful({
  server: [registry, web],
  error: function (err, throwErrorCount) {
    if (err.message) {
      err.message += ' (uncaughtException throw ' + throwErrorCount + ' times on pid:' + process.pid + ')';
    }
    console.error(err);
  }
});
