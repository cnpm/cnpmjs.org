/**!
 * cnpmjs.org - controllers/total.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 *  dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 */

'use strict';

/**
 * Module dependencies.
 */

var microtime = require('microtime');
var eventproxy = require('eventproxy');
var Total = require('../proxy/total');
var Download = require('./download');
var version = require('../package.json').version;
var config = require('../config');

var startTime = '' + microtime.now();

exports.show = function *() {
  var r = yield [Total.get(), Download.total()];
  var total = r[0];
  var download = r[1];

  total.download = download;
  total.db_name = 'registry';
  total.instance_start_time = startTime;
  total.node_version = process.version;
  total.app_version = version;
  total.donate = 'https://me.alipay.com/imk2';
  total.sync_model = config.syncModel;

  this.body = total;
};
