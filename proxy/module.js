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
var eventproxy = require('eventproxy');
var config = require('../config');
var mysql = require('../common/mysql');

var MODULE_COLUMNS = 'id, gmt_create, gmt_modified, author, name, version, package, dist_tarball, dist_shasum, dist_size';

// var INSERT_MODULE_SQL = 'INSERT INTO module(gmt_create, gmt_modified, author, name, version, package, dist_tarball, dist_shasum, dist_size) \
//   VALUES(now(), now(), ?, ?, ?, ?, ?, ?, ?);';

var INSERT_MODULE_SQL = 'INSERT INTO module(gmt_create, gmt_modified, \
  author, name, version, package, dist_tarball, dist_shasum, dist_size) \
  VALUES(now(), now(), ?, ?, ?, ?, ?, ?, ?) \
  ON DUPLICATE KEY UPDATE gmt_modified=now(), \
    author=VALUES(author), name=VALUES(name), version=VALUES(version), package=VALUES(package), \
    dist_tarball=VALUES(dist_tarball), dist_shasum=VALUES(dist_shasum), dist_size=VALUES(dist_size);';

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

var INSERT_TAG_SQL = 'INSERT INTO tag(gmt_create, gmt_modified, \
  name, tag, version, module_id) \
  VALUES(now(), now(), ?, ?, ?, ?) \
  ON DUPLICATE KEY UPDATE gmt_modified=now(), module_id=VALUES(module_id), \
    name=VALUES(name), tag=VALUES(tag), version=VALUES(version);';

var SELECT_MODULE_ID_SQL = 'SELECT id FROM module WHERE name=? AND version=?;';

exports.addTag = function (name, tag, version, callback) {
  mysql.queryOne(SELECT_MODULE_ID_SQL, [name, version], function (err, row) {
    if (err) {
      return callback(err);
    }
    var module_id = row && row.id || 0;
    mysql.query(INSERT_TAG_SQL, [name, tag, version, module_id], function (err, result) {
      if (err) {
        return callback(err);
      }
      callback(null, {id: result.insertId, gmt_modified: new Date(), module_id: module_id});
    });
  });
};

var SELECT_TAG_SQL = 'SELECT tag, version, gmt_modified, module_id FROM tag WHERE name=? AND tag=?;';

exports.getByTag = function (name, tag, callback) {
  mysql.queryOne(SELECT_TAG_SQL, [name, tag], function (err, row) {
    if (err || !row) {
      return callback(err, row);
    }
    exports.get(name, row.version, callback);
  });
};

var DELETE_TAGS_SQL = 'DELETE FROM tag WHERE name=?;';

exports.removeTags = function (name, callback) {
  mysql.query(DELETE_TAGS_SQL, [name], callback);
};

var SELECT_ALL_TAGS_SQL = 'SELECT tag, version, gmt_modified, module_id FROM tag WHERE name=?;';

exports.listTags = function (name, callback) {
  mysql.query(SELECT_ALL_TAGS_SQL, [name], callback);
};

var SELECT_LATEST_MODULE_SQL = 'SELECT ' + MODULE_COLUMNS +
  ' FROM module WHERE name=? AND version <> "next" ORDER BY id DESC LIMIT 1;';

exports.getLatest = function (name, callback) {
  exports.getByTag(name, 'latest', function (err, row) {
    if (err || row) {
      return callback(err, row);
    }

    // get latest order by id
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

var LIST_SINCE_SQL = 'SELECT name, package FROM module WHERE id IN\
                      (SELECT module_id FROM tag WHERE tag="latest" AND name IN\
                      (SELECT distinct(name) FROM module WHERE gmt_modified > ?))\
                      ORDER BY name';
exports.listSince = function (start, callback) {
  mysql.query(LIST_SINCE_SQL, [start], callback);
};

var LIST_SHORT_SQL = 'SELECT distinct(name) FROM module ORDER BY name';
exports.listShort = function (callback) {
  mysql.query(LIST_SHORT_SQL, callback);
};

var DELETE_MODULE_BY_NAME_SQL = 'DELETE FROM module WHERE name=?;';
exports.removeByName = function (name, callback) {
  mysql.query(DELETE_MODULE_BY_NAME_SQL, [name], callback);
};

var DELETE_MODULE_BY_NAME_AND_VERSIONS_SQL = 'DELETE FROM module WHERE name=? AND version IN(?);';
exports.removeByNameAndVersions = function (name, versions, callback) {
  mysql.query(DELETE_MODULE_BY_NAME_AND_VERSIONS_SQL, [name, versions], callback);
};

var LIST_RECENTLY_NAMES_SQL = 'SELECT distinct(name) AS name FROM module WHERE author = ? ORDER BY id DESC LIMIT 100;';
var LIST_BY_NAMES_SQL = 'SELECT name, package FROM module WHERE id IN \
  ( \
    SELECT module_id FROM tag WHERE tag="latest" AND name IN (?) \
  ) ORDER BY id DESC;';
exports.listByAuthor = function (author, callback) {
  var ep = eventproxy.create();
  ep.fail(callback);
  mysql.query(LIST_RECENTLY_NAMES_SQL, [author], ep.done(function (rows) {
    if (!rows || rows.length === 0) {
      return callback(null, []);
    }
    ep.emit('names', rows.map(function (r) {
      return r.name;
    }));
  }));
  ep.on('names', function (names) {
    mysql.query(LIST_BY_NAMES_SQL, [names], ep.done('modules'));
  });
  ep.on('modules', function (modules) {
    callback(null, modules);
  });
};
