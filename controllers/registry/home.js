/**!
 * cnpmjs.org - controllers/registry/home.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var microtime = require('microtime');
var eventproxy = require('eventproxy');
var Total = require('../../proxy/total');
var down = require('../download');

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
    total.donate = 'https://me.alipay.com/imk2';
    var callback = req.query.callback;
    if (callback) {
      // support jsonp
      res.jsonp(total, callback);
    } else {
      res.json(total);
    }
  });
};
