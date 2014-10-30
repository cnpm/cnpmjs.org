/**!
 * cnpmjs.org - services/total.js
 *
 * Copyright(c) fengmk2 and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var config = require('../config');
var models = require('../models');
var Total = models.Total;

exports.get = function* () {
  // var DB_SIZE_SQL = 'SELECT TABLE_NAME AS name, data_length, index_length \
  //   FROM information_schema.tables WHERE TABLE_SCHEMA = ? \
  //   GROUP BY TABLE_NAME \
  //   ORDER BY data_length DESC \
  //   LIMIT 0, 200';
  var TOTAL_MODULE_SQL = 'SELECT count(distinct(name)) AS count FROM `module`;';
  var TOTAL_VERSION_SQL = 'SELECT count(name) AS count FROM `module`;';
  var TOTAL_USER_SQL = 'SELECT count(name) AS count FROM `user`;';
  var rs = yield [
    // models.query(DB_SIZE_SQL, [config.db]),
    models.queryOne(TOTAL_MODULE_SQL),
    models.queryOne(TOTAL_VERSION_SQL),
    models.queryOne(TOTAL_USER_SQL),
    exports.getTotalInfo(),
  ];

  // var sizes = rs[0];
  var mc = rs[0];
  var vc = rs[1];
  var uc = rs[2];
  var info = rs[3] || {};

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
    store_engine: config.database.dialect,
    sync_status: info.sync_status,
    need_sync_num: info.need_sync_num || 0,
    success_sync_num: info.success_sync_num || 0,
    fail_sync_num: info.fail_sync_num || 0,
    left_sync_num: info.left_sync_num || 0,
    last_sync_time: info.last_sync_time || 0,
    last_exist_sync_time: info.last_exist_sync_time || 0,
    last_sync_module: info.last_sync_module || '',
  };

  // for (var i = 0; i < sizes.length; i++) {
  //   var row = sizes[i];
  //   total.data_tables[row.name] = {
  //     data_size: row.data_length,
  //     index_size: row.index_length,
  //   };
  //   total.data_size += row.data_length;
  //   total.index_size += row.index_length;
  // }

  total.disk_size = total.data_size + total.index_size;

  return total;
};

exports.getTotalInfo = function* () {
  return yield Total.find({
    where: {
      name: 'total'
    }
  });
};

exports.plusDeleteModule = function* () {
  var sql = 'UPDATE total SET module_delete=module_delete+1 WHERE name="total"';
  return yield* models.query(sql);
};

exports.setLastSyncTime = function* (time) {
  var sql = 'UPDATE total SET last_sync_time=? WHERE name="total"';
  return yield* models.query(sql, [Number(time)]);
};

exports.setLastExistSyncTime = function* (time) {
  var sql = 'UPDATE total SET last_exist_sync_time=? WHERE name="total"';
  return yield* models.query(sql, [Number(time)]);
};

exports.updateSyncStatus = function* (status) {
  var sql = 'UPDATE total SET sync_status=? WHERE name="total"';
  return yield* models.query(sql, [status]);
};

exports.updateSyncNum = function* (params) {
  var arg = {
    sync_status: params.syncStatus,
    need_sync_num: params.need || 0,
    success_sync_num: params.success || 0,
    fail_sync_num: params.fail || 0,
    left_sync_num: params.left || 0,
    last_sync_module: params.lastSyncModule
  };
  var sql = 'UPDATE total SET ? WHERE name="total"';
  return yield* models.query(sql, [arg]);
};
