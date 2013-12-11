/**!
 * cnpmjs.org - controllers/download.js
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
var npm = require('../proxy/npm');
var Log = require('../proxy/module_log');
var SyncModuleWorker = require('./sync_module_worker');

function _sync(name, username, callback) {
  npm.get(name, function (err, pkg, response) {
    if (err) {
      return callback(err);
    }
    if (!pkg || !pkg._rev) {
      return callback(null, {
        ok: false,
        statusCode: response.statusCode,
        pkg: pkg
      });
    }
    Log.create({name: name, username: username}, function (err, result) {
      if (err) {
        return callback(err);
      }
      var worker = new SyncModuleWorker({
        logId: result.id,
        name: name,
        username: username,
      });
      worker.start();
      callback(null, {
        ok: true,
        logId: result.id,
        pkg: pkg
      });
    });
  });
}

module.exports = _sync;
