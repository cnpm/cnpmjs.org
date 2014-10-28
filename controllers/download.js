/**!
 * cnpmjs.org - controllers/download.js
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

var moment = require('moment');
var downloadTotalService = require('../services/download_total');

exports.total = function* (name) {
  var end = moment();
  var start = end.clone().subtract(1, 'months').startOf('month');
  var lastday = end.clone().subtract(1, 'days').format('YYYY-MM-DD');
  var lastweekStart = end.clone().subtract(1, 'weeks').startOf('week');
  var lastweekEnd = lastweekStart.clone().endOf('week').format('YYYY-MM-DD');
  var lastmonthEnd = start.clone().endOf('month').format('YYYY-MM-DD');
  var thismonthStart = end.clone().startOf('month').format('YYYY-MM-DD');
  var thisweekStart = end.clone().startOf('week').format('YYYY-MM-DD');
  start = start.format('YYYY-MM-DD');
  end = end.format('YYYY-MM-DD');
  lastweekStart = lastweekStart.format('YYYY-MM-DD');
  var method = name ? 'getModuleTotal' : 'getTotal';
  var args = [start, end];
  if (name) {
    args.unshift(name);
  }

  var rows = yield* downloadTotalService[method].apply(downloadTotalService, args);
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
  return download;
};
