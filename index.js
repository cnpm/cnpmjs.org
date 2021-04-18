'use strict';

var config = require('./config');

exports.loadConfig = config.loadConfig;
exports.config = config;

exports.startWorker = function (customConfig) {
  config.loadConfig(customConfig);
  require('./worker');
};

exports.startSync = function (customConfig) {
  config.loadConfig(customConfig);
  require('./sync');
};
