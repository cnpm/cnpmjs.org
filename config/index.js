/**!
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
var os = require('os');
var mkdirp = require('mkdirp');
var copy = require('copy-to');

fs.existsSync = fs.existsSync || path.existsSync;
var version = require('../package.json').version;

var root = path.dirname(__dirname);

var config = {
  version: version,
  registryPort: 7001,
  webPort: 7002,
  bindingHost: '127.0.0.1', // only binding on 127.0.0.1 for local access
  enableCluster: false,
  numCPUs: os.cpus().length,
  debug: true, // if debug
  logdir: path.join(root, '.tmp', 'logs'),
  viewCache: false,
  // mysql config
  mysqlServers: [
    {
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: ''
    }
  ],
  mysqlDatabase: 'cnpmjs_test',
  mysqlMaxConnections: 4,
  mysqlQueryTimeout: 5000,

  sessionSecret: 'cnpmjs.org test session secret',
  redis: {
    // host: 'pub-redis-19533.us-east-1-4.3.ec2.garantiadata.com',
    // port: 19533,
    // pass: 'cnpmjs_dev'
  },
  jsonLimit: '10mb', // max request json body size
  uploadDir: path.join(root, '.dist'),
  // qiniu cdn: http://www.qiniu.com/, it free for dev.
  qn: {
    // accessKey: "iN7NgwM31j4-BZacMjPrOQBs34UG1maYCAQmhdCV",
    // secretKey: "6QTOr2Jg1gcZEWDQXKOGZh5PziC2MCV5KsntT70j",
    // bucket: "qtestbucket",
    // domain: "http://qtestbucket.qiniudn.com",
    accessKey: "5UyUq-l6jsWqZMU6tuQ85Msehrs3Dr58G-mCZ9rE",
    secretKey: "YaRsPKiYm4nGUt8mdz2QxeV5Q_yaUzVxagRuWTfM",
    bucket: "qiniu-sdk-test",
    domain: "http://qiniu-sdk-test.qiniudn.com",
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

  noticeSyncDistError: true,
  disturl: 'http://nodejs.org/dist',
  syncDist: false,
  logoURL: 'http://ww4.sinaimg.cn/large/69c1d4acgw1ebfly5kjlij208202oglr.jpg',
  registryHost: 'r.cnpmjs.org',
  // customReadmeFile: __dirname + '/web_readme.md',
  customReadmeFile: '', // you can use your custom readme file instead the cnpm one
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
  syncInterval: '10m', // sync interval, default is 10 minutes
  maxDependencies: 200, // max handle number of package.json `dependencies` property

  limit: {
    enable: false,
    token: 'koa-limit:download',
    limit: 1000,
    interval: 1000 * 60 * 60 * 24,
    whiteList: [],
    blackList: [],
    message: 'request frequency limited, any question, please contact fengmk2@gmail.com',
  },
  enableCompress: false, // enable gzip response or not
};

// load config/config.js, everything in config.js will cover the same key in index.js
var customConfig = path.join(root, 'config/config.js');
if (fs.existsSync(customConfig)) {
  copy(require(customConfig)).override(config);
}

mkdirp.sync(config.logdir);
mkdirp.sync(config.uploadDir);

module.exports = config;

config.loadConfig = function (customConfig) {
  if (!customConfig) {
    return;
  }
  copy(customConfig).override(config);
};
