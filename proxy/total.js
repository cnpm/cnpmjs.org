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

/**
 * Module dependencies.
 */

var thunkify = require('thunkify-wrap');
var eventproxy = require('eventproxy');
var config = require('../config');
var mysql = require('../common/mysql');

var DB_SIZE_SQL = 'SELECT TABLE_NAME AS name, data_length, index_length \
  FROM information_schema.tables \
  WHERE TABLE_SCHEMA = ? \
  GROUP BY TABLE_NAME \
  ORDER BY data_length DESC \
  LIMIT 0 , 200';

var TOTAL_MODULE_SQL = 'SELECT count(distinct(name)) AS count FROM module;';
var TOTAL_VERSION_SQL = 'SELECT count(name) AS count FROM module;';
var TOTAL_USER_SQL = 'SELECT count(name) AS count FROM user;';
var TOTAL_INFO_SQL = 'SELECT * FROM total WHERE name="total";';

exports.get = function (callback) {
  var ep = eventproxy.create();
  ep.fail(callback);

  mysql.queryOne(TOTAL_MODULE_SQL, ep.done('module'));
  mysql.queryOne(TOTAL_USER_SQL, ep.done('user'));
  mysql.queryOne(TOTAL_VERSION_SQL, ep.done('version'));
  mysql.query(DB_SIZE_SQL, [config.mysqlDatabase], ep.done('db_sizes'));
  mysql.queryOne(TOTAL_INFO_SQL, ep.done('info'));

  ep.all('db_sizes', 'module', 'version', 'user', 'info',
  function (sizes, mc, vc, uc, info) {
    info = info || {};
    var total = {
      data_tables: {},
      disk_size: 0,
      data_size: 0,
      index_size: 0,
      disk_format_version: 0,
      committed_update_seq: 0,
      update_seq: 0,
      purge_seq: 0,
      compact_running: false,
      doc_count: mc.count,
      doc_del_count: info.module_delete || 0,
      doc_version_count: vc.count,
      user_count: uc.count,
      store_engine: 'mysql',
      sync_status: info.sync_status,
      need_sync_num: info.need_sync_num || 0,
      success_sync_num: info.success_sync_num || 0,
      fail_sync_num: info.fail_sync_num || 0,
      left_sync_num: info.left_sync_num || 0,
      last_sync_time: info.last_sync_time || 0,
      last_exist_sync_time: info.last_exist_sync_time || 0,
      last_sync_module: info.last_sync_module || '',
    };

    for (var i = 0; i < sizes.length; i++) {
      var row = sizes[i];
      total.data_tables[row.name] = {
        data_size: row.data_length,
        index_size: row.index_length,
      };
      total.data_size += row.data_length;
      total.index_size += row.index_length;
    }

    total.disk_size = total.data_size + total.index_size;
    callback(null, total);
  });
};

var PLUS_DELETE_MODULE_SQL = 'UPDATE total SET module_delete=module_delete+1 WHERE name="total";';
exports.plusDeleteModule = function (callback) {
  mysql.query(PLUS_DELETE_MODULE_SQL, callback);
};

exports.getTotalInfo = function (callback) {
  mysql.queryOne(TOTAL_INFO_SQL, callback);
};

var SET_LAST_SYNC_TIME_SQL = 'UPDATE total SET last_sync_time=? WHERE name="total";';
exports.setLastSyncTime = function (time, callback) {
  mysql.query(SET_LAST_SYNC_TIME_SQL, Number(time), callback);
};

var SET_LAST_EXIST_SYNC_TIME_SQL = 'UPDATE total SET last_exist_sync_time=? WHERE name="total";';
exports.setLastExistSyncTime = function (time, callback) {
  mysql.query(SET_LAST_EXIST_SYNC_TIME_SQL, Number(time), callback);
};

var UPDATE_SYNC_STATUS_SQL = 'UPDATE total SET sync_status = ? WHERE name="total";';
exports.updateSyncStatus = function (status, callback) {
  mysql.query(UPDATE_SYNC_STATUS_SQL, [status], callback);
};

var UPDATE_SYNC_NUM_SQL = 'UPDATE total SET sync_status = ?, need_sync_num = ?, \
  success_sync_num = ?, fail_sync_num = ?, left_sync_num = ?, last_sync_module=? \
  WHERE name="total";';
exports.updateSyncNum = function (params, callback) {
  var query = [
    params.syncStatus, params.need || 0,
    params.success || 0, params.fail || 0, params.left || 0,
    params.lastSyncModule,
  ];
  mysql.query(UPDATE_SYNC_NUM_SQL, query, callback);
};

thunkify(exports);
