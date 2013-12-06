/*!
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
var Total = require('../../proxy/total');

var startTime = '' + microtime.now();

exports.show = function (req, res, next) {
  Total.get(function (err, total) {
    if (err) {
      return next(err);
    }

    total.db_name = 'registry';
    total.instance_start_time = startTime;
    total.donate = 'https://me.alipay.com/imk2';
    res.json(total);
  });
};
