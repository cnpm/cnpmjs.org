'use strict';

const co = require('co');
const urllib = require('urllib');
const config = require('../config');
const logger = require('../common/logger');

exports.trigger = envelope => {
  
  if (!config.globalHook) {
    return;
  }

  envelope.time = Date.now();

  co(function* () {
    yield urllib.request(config.globalHook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      data: envelope,
      gzip: true,
    });
  }).catch(err => {
    logger.error(err);
  });
};
