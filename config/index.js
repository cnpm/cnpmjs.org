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

  /**
   * Cluster mode
   */
  enableCluster: false,
  numCPUs: os.cpus().length,

  /*
   * server configure
   */
  registryPort: 7001,
  webPort: 7002,
  bindingHost: '127.0.0.1', // only binding on 127.0.0.1 for local access

  // debug mode
  // if in debug mode, some middleware like limit wont load
  // logger module will print to stdout
  debug: true,
  // session secret
  sessionSecret: 'cnpmjs.org test session secret',
  // max request json body size
  jsonLimit: '10mb',
  // log dir name
  logdir: path.join(root, '.tmp', 'logs'),
  // update file template dir
  uploadDir: path.join(root, '.dist'),
  // web page viewCache
  viewCache: false,

  // config for koa-limit middleware
  // for limit download rates
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

  // default system admins
  admins: {
    // name: email
    fengmk2: 'fengmk2@gmail.com',
    admin: 'admin@cnpmjs.org',
    dead_horse: 'dead_horse@qq.com',
    cnpmjstest10: 'cnpmjstest10@cnpmjs.org',
  },

  // email notification for errors
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


  logoURL: '//ww4.sinaimg.cn/large/69c1d4acgw1ebfly5kjlij208202oglr.jpg', // cnpm logo image url
  customReadmeFile: '', // you can use your custom readme file instead the cnpm one
  customFooter: '', // you can add copyright and site total script html here
  npmClientName: 'cnpm', // use `${name} install package`
  packagePageContributorSearch: true, // package page contributor link to search, default is true

  // max handle number of package.json `dependencies` property
  maxDependencies: 200,
  // backup filepath prefix
  backupFilePrefix: '/cnpm/backup/',

  /**
   * mysql config
   */

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


  // redis config
  // use for koa-limit module as storage
  redis: null,

  // package tarball store in qn by default
  // qiniu cdn: http://www.qiniu.com/, it free for dev.
  qn: {
    accessKey: "5UyUq-l6jsWqZMU6tuQ85Msehrs3Dr58G-mCZ9rE",
    secretKey: "YaRsPKiYm4nGUt8mdz2QxeV5Q_yaUzVxagRuWTfM",
    bucket: "qiniu-sdk-test",
    domain: "http://qiniu-sdk-test.qiniudn.com",
  },

  // registry url name
  registryHost: 'r.cnpmjs.org',


  /**
   * registry mode config
   */

  // enable private mode, only admin can publish, other use just can sync package from source npm
  enablePrivate: true,

  // registry scopes, if don't set, means do not support scopes
  scopes: [
    '@cnpm',
    '@cnpmtest'
  ],

  // redirect @cnpm/private-package => private-package
  // forward compatbility for update from lower version cnpmjs.org
  adaptScope: true,

  // force user publish with scope
  // but admins still can publish without scope
  forcePublishWithScope: true,

  // some registry already have some private packages in global scope
  // but we want to treat them as scoped private packages,
  // so you can use this white list.
  privatePackages: ['private-package'],

  /**
   * sync configs
   */

  // sync dist config
  // sync node.js dist from nodejs.org
  noticeSyncDistError: true,
  disturl: 'http://nodejs.org/dist',
  syncDist: false,

  // sync source
  sourceNpmRegistry: 'http://registry.npmjs.org',

  // if install return 404, try to sync from source registry
  syncByInstall: true,

  // sync mode select
  // none: do not sync any module
  // exist: only sync exist modules
  // all: sync all modules
  syncModel: 'none', // 'none', 'all', 'exist'

  syncConcurrency: 1,
  // sync interval, default is 10 minutes
  syncInterval: '10m',
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
