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
  viewCache: false,
  // mysql config
  mysqlServers: [
    {
      host: 'keydiary.mysql.rds.aliyuncs.com', // 'db4free.net'
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
  jsonLimit: '10mb', // max request json body size
  uploadDir: path.join(root, 'public', 'dist'),
  // qiniu cdn: http://www.qiniu.com/, it free for dev.
  qn: {
    accessKey: "iN7NgwM31j4-BZacMjPrOQBs34UG1maYCAQmhdCV",
    secretKey: "6QTOr2Jg1gcZEWDQXKOGZh5PziC2MCV5KsntT70j",
    bucket: "qtestbucket",
    domain: "http://qtestbucket.qiniudn.com"
  },

  mail: {
    appname: 'cnpmjs.org',
    sender: 'cnpmjs.org mail sender <adderss@gmail.com>',
    host: 'smtp.gmail.com',
    port: 465,
    user: 'address@gmail.com',
    pass: 'your password',
    ssl: true,
    debug: false
  },

  logoURL: 'http://ww4.sinaimg.cn/large/69c1d4acgw1ebfly5kjlij208202oglr.jpg',
  registryHost: 'r.cnpmjs.org',
  customFooter: '', // you can add copyright and site total script html here
  npmClientName: 'cnpm', // use `${name} install package`
  packagePageContributorSearch: true, // package page contributor link to search, default is true
  sourceNpmRegistry: 'http://registry.npmjs.org',
  enablePrivate: true, // enable private mode, only admin can publish, other use just can sync package from source npm
  admins: {
    fengmk2: 'fengmk2@gmail.com',
    admin: 'admin@cnpmjs.org',
    dead_horse: 'dead_horse@qq.com',
    cnpmjstest10: 'cnpmjstest10@cnpmjs.org',
  },
  syncByInstall: true,
  backupFilePrefix: '/cnpm/backup/', // backup filepath prefix
  syncModel: 'none', // 'none', 'all', 'exist'
  syncConcurrency: 1,
  maxDependencies: 200, // max handle number of package.json `dependencies` property
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

config.loadConfig = function (customConfig) {
  if (!customConfig) {
    return;
  }
  for (var key in customConfig) {
    config[key] = customConfig[key];
  }
};
