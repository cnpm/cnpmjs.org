/**!
 * cnpmjs.org - proxy/total.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';
/* jshint -W032 */

/**
 * Module dependencies.
 */

var thunkify = require('thunkify-wrap');
var eventproxy = require('eventproxy');
var config = require('../config');
var mysql = require('../common/mysql');
var multiline = require('multiline');

var PLUS_DELETE_MODULE_SQL = multiline(function () {;/*
  UPDATE
    total
  SET
    module_delete=module_delete+1
  WHERE
    name="total";
*/});
exports.plusDeleteModule = function (callback) {
  mysql.query(PLUS_DELETE_MODULE_SQL, callback);
};



var SET_LAST_SYNC_TIME_SQL = multiline(function () {;/*
  UPDATE
    total
  SET
    last_sync_time=?
  WHERE
    name="total";
*/});
exports.setLastSyncTime = function (time, callback) {
  mysql.query(SET_LAST_SYNC_TIME_SQL, Number(time), callback);
};

var SET_LAST_EXIST_SYNC_TIME_SQL = multiline(function () {;/*
  UPDATE
    total
  SET
    last_exist_sync_time=?
  WHERE
    name="total";
*/});
exports.setLastExistSyncTime = function (time, callback) {
  mysql.query(SET_LAST_EXIST_SYNC_TIME_SQL, Number(time), callback);
};

var UPDATE_SYNC_STATUS_SQL = multiline(function () {;/*
  UPDATE
    total
  SET
    sync_status=?
  WHERE
    name="total";
*/});
exports.updateSyncStatus = function (status, callback) {
  mysql.query(UPDATE_SYNC_STATUS_SQL, [status], callback);
};

var UPDATE_SYNC_NUM_SQL = multiline(function () {;/*
  UPDATE
    total
  SET
    ?
  WHERE
    name="total";
*/});
exports.updateSyncNum = function (params, callback) {
  var arg = {
    sync_status: params.syncStatus,
    need_sync_num: params.need || 0,
    success_sync_num: params.success || 0,
    fail_sync_num: params.fail || 0,
    left_sync_num: params.left || 0,
    last_sync_module: params.lastSyncModule
  };

  mysql.query(UPDATE_SYNC_NUM_SQL, [arg], callback);
};

thunkify(exports);
