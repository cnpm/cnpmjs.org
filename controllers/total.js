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
var down = require('./download');
var version = require('../package.json').version;
var config = require('../config');

var startTime = '' + microtime.now();

exports.show = function (req, res, next) {
  var ep = eventproxy.create();
  ep.fail(next);

  Total.get(ep.done('total'));
  down.total(null, ep.done('download'));
  ep.all('total', 'download', function (total, download) {
    total.download = download;
    total.db_name = 'registry';
    total.instance_start_time = startTime;
    total.node_version = process.version;
    total.app_version = version;
    total.donate = 'https://me.alipay.com/imk2';
    total.sync_model = config.syncModel;
    if (req.query.callback) {
      return res.jsonp(total, req.query.callback);
    }
    res.json(total);
  });
};
