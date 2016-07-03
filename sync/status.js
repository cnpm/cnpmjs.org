'use strict';

var debug = require('debug')('cnpmjs.org:sync:status');
var co = require('co');
var Total = require('../services/total');

function Status(options) {
  this.need = options.need;
  this.lastSyncModule = '';
  this.successes = 0;
  this.fails = 0;
  this.left = options.need;
}

Status.prototype.log = function (syncDone) {
  var params = {
    syncStatus: syncDone ? 0 : 1,
    need: this.need,
    success: this.successes,
    fail: this.fails,
    left: this.left,
    lastSyncModule: this.lastSyncModule,
  };
  co(function* () {
    yield Total.updateSyncNum(params);
  }).catch(function () {});
};

Status.prototype.start = function () {
  if (this.started) {
    return;
  }
  this.started = true;
  //every 30s log it into mysql
  this.timer = setInterval(this.log.bind(this), 30000);
};

Status.prototype.stop = function () {
  this.log(true);
  clearInterval(this.timer);
  this.timer = null;
  this.started = false;
};

Status.init = function (options, worker) {
  var status = new Status(options);
  status.start();
  worker.on('success', function (moduleName) {
    debug('sync [%s] success', moduleName);
    status.lastSyncModule = moduleName;
    status.successes++;
    status.left--;
  });
  worker.on('fail', function () {
    status.fails++;
    status.left--;
  });
  worker.on('add', function () {
    status.left++;
  });

  worker.on('end', function () {
    status.stop();
  });
};

module.exports = Status;
