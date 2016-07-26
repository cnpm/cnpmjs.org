'use strict';

var graceful = require('graceful');
var registry = require('./servers/registry');
var web = require('./servers/web');
var logger = require('./common/logger');
var config = require('./config');

registry.listen(config.registryPort, config.bindingHost);
web.listen(config.webPort, config.bindingHost);

console.log('[%s] [worker:%d] Server started, registry server listen at %s:%d, web listen at %s:%d, cluster: %s',
  new Date(), process.pid,
  config.bindingHost, config.registryPort,
  config.bindingHost, config.webPort,
  config.enableCluster);

graceful({
  server: [registry, web],
  error: function (err, throwErrorCount) {
    if (err.message) {
      err.message += ' (uncaughtException throw ' + throwErrorCount + ' times on pid:' + process.pid + ')';
    }
    console.error(err);
    console.error(err.stack);
    logger.error(err);
  }
});
