/**!
 * cnpmjs.org - middleware/sync_by_install.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 */

'use strict';

/**
 * Module dependencies.
 */

var defer = require('co-defer');
var downloadTotalService = require('../services/download_total');
var debug = require('debug')('cnpmjs.org:middleware:sync_by_install');
var logger = require('../common/logger');
var utility = require('utility');
var config = require('../config');

var _downloads = {};

/**
 * this.allowSync  -  allow sync triggle by cnpm install
 */

module.exports = function* syncByInstall(next) {
  this.allowSync = false;
  if (!config.syncByInstall) {
    // only config.enablePrivate should enable sync on install
    return yield* next;
  }
  // request not by node, consider it request from web, dont sync
  var ua = this.get('user-agent');
  if (!ua || ua.indexOf('node') < 0) {
    return yield* next;
  }

  // if request with `/xxx?write=true`, meaning the read request using for write, dont sync
  if (this.query.write) {
    return yield* next;
  }

  var name = this.params.name || this.params[0];
  _downloads[name] = (_downloads[name] || 0) + 1; // record download count

  // scoped package dont sync
  if (name && name[0] === '@') {
    return yield* next;
  }

  this.allowSync = true;
  yield* next;
};

defer.setInterval(function* () {
  // save download count
  var totals = [];
  for (var name in _downloads) {
    var count = _downloads[name];
    totals.push([name, count]);
  }
  _downloads = {};

  if (totals.length === 0) {
    return;
  }

  debug('save download total: %j', totals);

  var date = utility.YYYYMMDD();
  for (var i = 0; i < totals.length; i++) {
    var item = totals[i];
    var name = item[0];
    var count = item[1];
    try {
      yield* downloadTotalService.plusModuleTotal({ name: name, date: date, count: count });
    } catch (err) {
      err.message += '; name: ' + name + ', count: ' + count + ', date: ' + date;
      logger.error(err);
      // save back to _downloads, try again next time
      _downloads[name] = (_downloads[name] || 0) + count;
    }
  }
}, 5000);
