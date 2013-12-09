/*!
 * cnpmjs.org - config/index.js
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

var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');

fs.existsSync = fs.existsSync || path.existsSync;
var pkg = require('../package.json');

var root = path.dirname(__dirname);

var config = {
  version: pkg.version,
  registryPort: 7001,
  webPort: 7002,
  enableCluster: false,
  debug: true, // if debug
  logdir: path.join(root, '.tmp', 'logs'),
  // mysql config
  mysqlServers: [
    {
      host: 'db4free.net',
      port: 3306,
      user: 'cnpmjs',
      password: 'cnpmjs123'
    }
  ],
  mysqlDatabase: 'cnpmjstest',
  mysqlMaxConnections: 4,
  mysqlQueryTimeout: 5000,

  sessionSecret: 'cnpmjs.org test session secret',
  redis: {
    host: 'pub-redis-19533.us-east-1-4.3.ec2.garantiadata.com',
    port: 19533,
    pass: 'cnpmjs_dev'
  },
  uploadDir: path.join(root, 'public', 'dist'),
  qn: {
    accessKey: "iN7NgwM31j4-BZacMjPrOQBs34UG1maYCAQmhdCV",
    secretKey: "6QTOr2Jg1gcZEWDQXKOGZh5PziC2MCV5KsntT70j",
    bucket: "qtestbucket",
    domain: "http://qtestbucket.qiniudn.com"
  },

  sourceNpmRegistry: 'http://registry.npmjs.org',
  enablePrivate: true, // enable private mode, only admin can publish, other use just can sync package from source npm
  admins: {
    admin: true,
    fengmk2: true,
    dead_horse: true,
    cnpmjstest10: true,
  },
  syncByInstall: true
};

// load config/config.js, everything in config.js will cover the same key in index.js
var customConfig = path.join(root, 'config/config.js');
if (fs.existsSync(customConfig)) {
  var options = require(customConfig);
  for (var k in options) {
    config[k] = options[k];
  }
}

mkdirp.sync(config.logdir);
mkdirp.sync(config.uploadDir);

module.exports = config;
