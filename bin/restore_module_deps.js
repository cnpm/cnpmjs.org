/**!
 * cnpmjs.org - bin/restore_module_deps.js
 *
 * Copyright(c) 2014
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

"use strict";

/**
 * Module dependencies.
 */

var mysql = require('../common/mysql');
var Module = require('../proxy/module');
var ModuleDeps = require('../proxy/module_deps');

var addCount = 0;

function restore(id, callback) {
  var sql = 'SELECT id, name, package FROM module WHERE id > ? ORDER BY id ASC LIMIT 1000';
  mysql.query(sql, [id], function (err, rows) {
    if (err) {
      return callback(err);
    }
    if (rows.length === 0) {
      return callback(null, []);
    }

    console.log('[%s] got %d rows', id, rows.length);

    rows.forEach(function (r) {
      Module.parseRow(r);
      if (!r.package) {
        return;
      }
      var deps = Object.keys(r.package.dependencies || {});
      if (!Array.isArray(deps) || !deps.length) {
        return;
      }
      deps.forEach(function (dep) {
        ModuleDeps.add(dep, r.name, function (err) {
          // console.log('[%s] add %s <= %s, error: %s', id, dep, r.name, err);
        });
      });
      addCount += deps.length;
    });
    setTimeout(function () {
      console.log('[%s] add %d relations', id, addCount);
      callback(null, rows);
    }, 1000);
  });
}

var id = 0;
function run() {
  restore(id, function (err, rows) {
    if (err) {
      throw err;
    }
    if (rows.length === 0) {
      console.log('finished, last id: %s, exit.', id);
      process.exit(0);
    }

    id = rows[rows.length - 1].id;
    run();
  });
}

run();
