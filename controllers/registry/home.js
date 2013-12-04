/*!
 * cnpmjs.org - controllers/registry/home.js
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

var microtime = require('microtime');

var startTime = '' + microtime.now();

exports.show = function (req, res) {
  res.json({
    db_name: "registry",
    doc_count: 49723,
    doc_del_count: 4528,
    update_seq: 820897,
    purge_seq: 0,
    compact_running: false,
    disk_size: 151819346055,
    data_size: 132303912087,
    instance_start_time: startTime,
    disk_format_version: 6,
    committed_update_seq: 820897
  });
};
