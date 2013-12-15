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
var Log = require('../proxy/module_log');
var SyncModuleWorker = require('../proxy/sync_module_worker');

exports.sync = function (req, res, next) {
  var username = req.session.name || 'anonymous';
  var name = req.params.name;
  SyncModuleWorker.sync(name, username, function (err, result) {
    if (err) {
      return next(err);
    }
    if (!result.ok) {
      return res.json(result.statusCode, result.pkg);
    }
    res.json(201, {
      ok: true,
      logId: result.logId
    });
  });
};

exports.getSyncLog = function (req, res, next) {
  var logId = req.params.id;
  var name = req.params.name;
  var offset = Number(req.query.offset) || 0;
  Log.get(logId, function (err, row) {
    if (err || !row) {
      return next(err);
    }
    var log = row.log.trim();
    if (offset > 0) {
      log = log.split('\n').slice(offset).join('\n');
    }
    res.json(200, {ok: true, log: log});
  });
};
