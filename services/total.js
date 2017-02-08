'use strict';

const config = require('../config');
const models = require('../models');
const Total = models.Total;

const TOTAL_MODULE_SQL = 'SELECT count(distinct(name)) AS count FROM module;';
const TOTAL_VERSION_SQL = 'SELECT count(name) AS count FROM module;';
let TOTAL_USER_SQL = 'SELECT count(name) AS count FROM user;';
if (config.database.dialect === 'postgres') {
  // pg not allow table name as 'user'
  TOTAL_USER_SQL = 'SELECT count(name) AS count FROM public.user;';
}

exports.get = function* () {
  // var DB_SIZE_SQL = 'SELECT TABLE_NAME AS name, data_length, index_length \
  //   FROM information_schema.tables WHERE TABLE_SCHEMA = ? \
  //   GROUP BY TABLE_NAME \
  //   ORDER BY data_length DESC \
  //   LIMIT 0, 200';
  const rs = yield [
    // models.query(DB_SIZE_SQL, [config.db]),
    models.queryOne(TOTAL_MODULE_SQL),
    models.queryOne(TOTAL_VERSION_SQL),
    models.queryOne(TOTAL_USER_SQL),
    exports.getTotalInfo(),
  ];

  // var sizes = rs[0];
  const mc = rs[0];
  const vc = rs[1];
  const uc = rs[2];
  const info = rs[3] || {};

  if (typeof info.module_delete === 'string') {
    info.module_delete = Number(info.module_delete);
  }

  const total = {
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
  const row = yield Total.find({
    where: {
      name: 'total',
    },
  });
  if (row && typeof row.module_delete === 'string') {
    row.module_delete = Number(row.module_delete);
  }
  return row;
};

exports.plusDeleteModule = function* () {
  const sql = 'UPDATE total SET module_delete=module_delete+1 WHERE name=\'total\'';
  return yield models.query(sql);
};

exports.setLastSyncTime = function* (time) {
  const sql = 'UPDATE total SET last_sync_time=? WHERE name=\'total\'';
  return yield models.query(sql, [ Number(time) ]);
};

exports.setLastExistSyncTime = function* (time) {
  const sql = 'UPDATE total SET last_exist_sync_time=? WHERE name=\'total\'';
  return yield models.query(sql, [ Number(time) ]);
};

exports.updateSyncStatus = function* (status) {
  const sql = 'UPDATE total SET sync_status=? WHERE name=\'total\'';
  return yield models.query(sql, [ status ]);
};

exports.updateSyncNum = function* (params) {
  const args = [
    params.syncStatus,
    params.need || 0,
    params.success || 0,
    params.fail || 0,
    params.left || 0,
    params.lastSyncModule,
  ];
  const sql = `UPDATE total SET
    sync_status=?, need_sync_num=?, success_sync_num=?,
    fail_sync_num=?, left_sync_num=?, last_sync_module=?
    WHERE name='total'`;
  return yield models.query(sql, args);
};
