/*!
 * cnpmjs.org - sync/status.js
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

var Total = require('../proxy/total');
var utility = require('utility');

function Status(options) {
  this.worker = options.worker;
  this.need = options.need;
}

Status.prototype.log = function (syncDone) {
  var params = {
    syncStatus: syncDone ? 0 : 1,
    need: this.need,
    success: this.worker.successes.length,
    fail: this.worker.fails.length,
    left: this.worker.names.length
  };
  Total.updateSyncNum(params, utility.noop);
};

Status.prototype.start = function () {
  if (this.started) {
    return;
  }
  this.started = true;
  //every 30s log it into mysql
  this.timer = setInterval(this.log.bind(this), 30000);
  this.worker.on('end', function () {
    this.started = false;
    this.log(true);
    clearInterval(this.timer);
  }.bind(this));
};

Status.init = function (options) {
  return new Status(options);
};

module.exports = Status;
