'use strict';

var config = require('../config');
var limit = require('koa-limit');

var limitConfig = config.limit;

if (!limitConfig.enable) {
  module.exports = function* ignoreLimit(next) {
    yield next;
  };
} else {
  module.exports = limit(limitConfig);
}
