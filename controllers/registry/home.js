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
var moment = require('moment');
var Total = require('../../proxy/total');
var DownloadTotal = require('../../proxy/download');

var startTime = '' + microtime.now();

exports.show = function (req, res, next) {
  var ep = eventproxy.create();
  ep.fail(next);

  Total.get(ep.done('total'));

  var end = moment();
  var start = end.clone().subtract('months', 1).startOf('month');
  var lastday = end.clone().subtract('days', 1).format('YYYY-MM-DD');
  var lastweekStart = end.clone().subtract('weeks', 1).startOf('week');
  var lastweekEnd = lastweekStart.clone().endOf('week').format('YYYY-MM-DD');
  var lastmonthEnd = start.clone().endOf('month').format('YYYY-MM-DD');
  var thismonthStart = end.clone().startOf('month').format('YYYY-MM-DD');
  var thisweekStart = end.clone().startOf('week').format('YYYY-MM-DD');
  start = start.format('YYYY-MM-DD');
  end = end.format('YYYY-MM-DD');
  lastweekStart = lastweekStart.format('YYYY-MM-DD');
  DownloadTotal.getTotal(start, end, ep.done(function (rows) {
    var download = {
      today: 0,
      thisweek: 0,
      thismonth: 0,
      lastday: 0,
      lastweek: 0,
      lastmonth: 0,
    };
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (r.date === end) {
        download.today += r.count;
      }
      if (r.date >= thismonthStart) {
        download.thismonth += r.count;
      }
      if (r.date >= thisweekStart) {
        download.thisweek += r.count;
      }

      if (r.date === lastday) {
        download.lastday += r.count;
      }
      if (r.date >= lastweekStart && r.date <= lastweekEnd) {
        download.lastweek += r.count;
      }
      if (r.date >= start && r.date <= lastmonthEnd) {
        download.lastmonth += r.count;
      }
    }
    ep.emit('download', download);
  }));

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
