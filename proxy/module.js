/**!
 * cnpmjs.org - proxy/module.js
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

var utility = require('utility');
var config = require('../config');
var mysql = require('../common/mysql');

var MODULE_COLUMNS = 'id, gmt_create, gmt_modified, author, name, version, package, dist_tarball, dist_shasum, dist_size';

var INSERT_MODULE_SQL = 'INSERT INTO module(gmt_create, gmt_modified, author, name, version, package, dist_tarball, dist_shasum, dist_size) \
  VALUES(now(), now(), ?, ?, ?, ?, ?, ?, ?);';

exports.add = function (mod, callback) {
  var pkg;
  try {
    pkg = JSON.stringify(mod.package);
  } catch (e) {
    return callback(e);
  }
  var dist = mod.package.dist || {};
  dist.tarball = '';
  dist.shasum = '';
  dist.size = 0;
  var values = [mod.author, mod.name, mod.version, pkg, dist.tarball, dist.shasum, dist.size];
  mysql.query(INSERT_MODULE_SQL, values, function (err, result) {
    if (err) {
      return callback(err);
    }
    callback(null, {id: result.insertId, gmt_modified: new Date()});
  });
};

var UPDATE_DIST_SQL = 'UPDATE module SET version=?, package=?, dist_tarball=?, dist_shasum=?, dist_size=? WHERE id=?;';

exports.update = function (mod, callback) {
  var pkg;
  try {
    pkg = JSON.stringify(mod.package);
  } catch (e) {
    return callback(e);
  }
  var dist = mod.package.dist;
  mysql.query(UPDATE_DIST_SQL, [mod.version, pkg, dist.tarball, dist.shasum, dist.size, mod.id],
  function (err, result) {
    if (err) {
      return callback(err);
    }
    callback(null, {id: mod.id, gmt_modified: new Date()});
  });
};

function parseRow(row) {
  row.package = JSON.parse(row.package);
}

var SELECT_MODULE_BY_ID_SQL = 'SELECT ' + MODULE_COLUMNS + ' FROM module WHERE id=?;';

exports.getById = function (id, callback) {
  id = Number(id);
  mysql.queryOne(SELECT_MODULE_BY_ID_SQL, [id], function (err, row) {
    if (err || !row) {
      return callback(err, row);
    }
    try {
      parseRow(row);
    } catch (e) {
      e.data = row;
      return callback(e);
    }
    callback(null, row);
  });
};

var SELECT_MODULE_SQL = 'SELECT ' + MODULE_COLUMNS + ' FROM module WHERE name=? AND version=?;';

exports.get = function (name, version, callback) {
  mysql.queryOne(SELECT_MODULE_SQL, [name, version], function (err, row) {
    if (err || !row) {
      return callback(err, row);
    }
    try {
      parseRow(row);
    } catch (e) {
      e.data = row;
      return callback(e);
    }
    callback(null, row);
  });
};

var SELECT_LATEST_MODULE_SQL = 'SELECT ' + MODULE_COLUMNS + ' FROM module WHERE name=? ORDER BY id DESC LIMIT 1;';

exports.getLatest = function (name, callback) {
  mysql.queryOne(SELECT_LATEST_MODULE_SQL, [name], function (err, row) {
    if (err || !row) {
      return callback(err, row);
    }
    try {
      parseRow(row);
    } catch (e) {
      e.data = row;
      return callback(e);
    }
    callback(null, row);
  });
};

var LIST_MODULE_SQL = 'SELECT ' + MODULE_COLUMNS + ' FROM module WHERE name=? ORDER BY id DESC;';

exports.listByName = function (name, callback) {
  mysql.query(LIST_MODULE_SQL, [name], function (err, rows) {
    if (err) {
      return callback(err);
    }

    rows = rows || [];
    try {
      for (var i = 0; i < rows.length; i++) {
        parseRow(rows[i]);
      }
    } catch (e) {
      err = e;
      err.data = rows;
    }
    callback(err, rows);
  });
};
