'use strict';

const config = require('../config');
const limit = require('koa-limit');

const limitConfig = config.limit;

if (!limitConfig.enable) {
  module.exports = function* ignoreLimit(next) {
    yield next;
  };
} else {
  module.exports = limit(limitConfig);
}
