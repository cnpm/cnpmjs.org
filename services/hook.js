'use strict';

const co = require('co');
const config = require('../config');
const logger = require('../common/logger');

exports.trigger = envelope => {
  if (!config.globalHook) {
    return;
  }

  envelope.time = Date.now();

  co(function* () {
    yield config.globalHook(envelope);
  }).catch(err => {
    logger.error(err);
  });
};
