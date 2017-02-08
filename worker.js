'use strict';

const graceful = require('graceful');
const registry = require('./servers/registry');
const web = require('./servers/web');
const logger = require('./common/logger');
const config = require('./config');

registry.listen(config.registryPort, config.bindingHost);
web.listen(config.webPort, config.bindingHost);

console.log('[%s] [worker:%d] Server started, registry server listen at %s:%d, web listen at %s:%d, cluster: %s',
  new Date(), process.pid,
  config.bindingHost, config.registryPort,
  config.bindingHost, config.webPort,
  config.enableCluster);

graceful({
  server: [ registry, web ],
  error(err, throwErrorCount) {
    if (err.message) {
      err.message += ' (uncaughtException throw ' + throwErrorCount + ' times on pid:' + process.pid + ')';
    }
    console.error(err);
    console.error(err.stack);
    logger.error(err);
  },
});
