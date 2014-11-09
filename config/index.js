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

var mkdirp = require('mkdirp');
var copy = require('copy-to');
var path = require('path');
var fs = require('fs');
var os = require('os');

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
  logdir: path.join(root, '.tmp/logs'),
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
  },

  // email notification for errors
  // check https://github.com/andris9/Nodemailer for more informations
  mail: {
    appname: 'cnpmjs.org',
    from: 'cnpmjs.org mail sender <adderss@gmail.com>',
    service: 'gmail',
    auth: {
      user: 'address@gmail.com',
      pass: 'your password'
    }
  },
  // forward Compat with old style
  // mail: {
  //   appname: 'cnpmjs.org',
  //   sender: 'cnpmjs.org mail sender <adderss@gmail.com>',
  //   host: 'smtp.gmail.com',
  //   port: 465,
  //   user: 'address@gmail.com',
  //   pass: 'your password',
  //   ssl: true,
  //   debug: false
  // },


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
   * database config
   */

  database: {
    db: 'cnpmjs_test',
    username: 'root',
    password: '',

    // the sql dialect of the database
    // - currently supported: 'mysql', 'sqlite', 'postgres', 'mariadb'
    dialect: 'sqlite',

    // custom host; default: 127.0.0.1
    host: '127.0.0.1',

    // custom port; default: 3306
    port: 3306,

    // use pooling in order to reduce db connection overload and to increase speed
    // currently only for mysql and postgresql (since v1.5.0)
    pool: {
      maxConnections: 10,
      minConnections: 0,
      maxIdleTime: 30000
    },

    // the storage engine for 'sqlite'
    // default store into ~/cnpmjs.org.sqlite
    storage: path.join(process.env.HOME || root, 'cnpmjs.org.sqlite'),

    logging: !!process.env.SQL_DEBUG,
  },

  // redis config
  // use for koa-limit module as storage
  redis: null,

  // package tarball store in local filesystem by default
  nfs: require('fs-cnpm')({
    dir: path.join(root, '.tmp', 'dist')
  }),

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

  // force user publish with scope
  // but admins still can publish without scope
  forcePublishWithScope: true,

  // some registry already have some private packages in global scope
  // but we want to treat them as scoped private packages,
  // so you can use this white list.
  privatePackages: [],

  /**
   * sync configs
   */

  // sync dist config
  // sync node.js dist from nodejs.org
  noticeSyncDistError: true,
  disturl: 'http://nodejs.org/dist',
  syncDist: false,

  pythonDisturl: 'https://www.python.org/ftp',
  syncPythonDist: false,

  // the official npm registry
  // cnpm wont directly sync from this one
  // but sometimes will request it for some package infomations
  // please don't change it if not necessary
  officialNpmRegistry: 'https://registry.npmjs.org',

  // sync source, upstream registry
  // If you want to directly sync from official npm's registry
  // please drop them an email first
  sourceNpmRegistry: 'http://registry.npm.taobao.org',

  // upstream registry is base on cnpm/cnpmjs.org or not
  // if your upstream is official npm registry, please turn it off
  sourceNpmRegistryIsCNpm: true,

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

  // sync polular modules, default to false
  // because cnpm can't auto sync tag change for now
  // so we want to sync popular modules to ensure their tags
  syncPopular: false,
  syncPopularInterval: '1h',
  // top 100
  topPopular: 100,

  // sync devDependencies or not, default is false
  syncDevDependencies: false,

  // badge subject on http://shields.io/
  badgeSubject: 'cnpm',
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
