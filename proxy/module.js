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

var MODULE_COLUMNS = 'id, publish_time, gmt_create, gmt_modified, author, name, version, description, package, dist_tarball, dist_shasum, dist_size';

// var INSERT_MODULE_SQL = 'INSERT INTO module(gmt_create, gmt_modified, author, name, version, package, dist_tarball, dist_shasum, dist_size) \
//   VALUES(now(), now(), ?, ?, ?, ?, ?, ?, ?);';

var INSERT_MODULE_SQL = 'INSERT INTO module(gmt_create, gmt_modified, \
  publish_time, author, name, version, package, dist_tarball, dist_shasum, dist_size, description) \
  VALUES(now(), now(), ?, ?, ?, ?, ?, ?, ?, ?, ?) \
  ON DUPLICATE KEY UPDATE gmt_modified=now(), publish_time=VALUES(publish_time), description=VALUES(description), \
    author=VALUES(author), name=VALUES(name), version=VALUES(version), package=VALUES(package), \
    dist_tarball=VALUES(dist_tarball), dist_shasum=VALUES(dist_shasum), dist_size=VALUES(dist_size);';

exports.add = function (mod, callback) {
  var pkg;
  try {
    pkg = stringifyPackage(mod.package);
  } catch (e) {
    return callback(e);
  }
  var description = mod.package && mod.package.description || '';

  var dist = mod.package.dist || {};
  dist.tarball = '';
  dist.shasum = '';
  dist.size = 0;
  var publish_time = mod.publish_time || Date.now();
  var values = [
    publish_time, mod.author, mod.name, mod.version, pkg,
    dist.tarball, dist.shasum, dist.size, description
  ];
  mysql.query(INSERT_MODULE_SQL, values, function (err, result) {
    if (err) {
      return callback(err);
    }
    callback(null, {id: result.insertId, gmt_modified: new Date()});
  });
};

var UPDATE_DESC_SQL = 'UPDATE module SET description=? WHERE id=?;';
exports.updateDescription = function (id, description, callback) {
  mysql.query(UPDATE_DESC_SQL, [description, id], callback);
};

var UPDATE_DIST_SQL = 'UPDATE module SET version=?, package=?, dist_tarball=?, dist_shasum=?, dist_size=? WHERE id=?;';

exports.update = function (mod, callback) {
  var pkg;
  try {
    pkg = stringifyPackage(mod.package);
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
  if (row && row.package) {
    try {
      if (row.package.indexOf('%7B%22') === 0) {
        // now store package will encodeURIComponent() after JSON.stringify
        row.package = decodeURIComponent(row.package);
      }
      row.package = JSON.parse(row.package);
    } catch (e) {
      console.warn('parse package error: %s, id: %s version: %s, error: %s', row.name, row.id, row.version, e);
    }
  }
}

function stringifyPackage(pkg) {
  return encodeURIComponent(JSON.stringify(pkg));
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
  ' FROM module WHERE name=? AND version <> "next" ORDER BY publish_time DESC LIMIT 1;';

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

var LIST_SINCE_SQLS = [
  'SELECT distinct(name) AS name FROM module WHERE publish_time > ?;',
  'SELECT module_id FROM tag WHERE tag="latest" AND name IN (?);',
  'SELECT name, package FROM module WHERE id IN (?);'
];
exports.listSince = function (start, callback) {
  var ep = eventproxy.create();
  ep.fail(callback);
  mysql.query(LIST_SINCE_SQLS[0], [start], ep.done(function (rows) {
    if (!rows || rows.length === 0) {
      return callback(null, []);
    }
    ep.emit('names', rows.map(function (r) {
      return r.name;
    }));
  }));

  ep.once('names', function (names) {
    mysql.query(LIST_SINCE_SQLS[1], [names], ep.done(function (rows) {
      if (!rows || rows.length === 0) {
        return callback(null, []);
      }      
      ep.emit('ids', rows.map(function (r) {
        return r.module_id;
      }));
    }));
  });

  ep.once('ids', function (ids) {
    mysql.query(LIST_SINCE_SQLS[2], [ids], callback);
  });
};

var LIST_SHORT_SQL = 'SELECT distinct(name) FROM tag ORDER BY name';
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

var LIST_BY_AUTH_SQLS = [
  'SELECT distinct(name) AS name FROM module WHERE author = ? ORDER BY publish_time DESC LIMIT 100;',
  'SELECT module_id FROM tag WHERE tag="latest" AND name IN (?)',
  'SELECT name, description FROM module WHERE id IN (?) ORDER BY publish_time DESC'
];
exports.listByAuthor = function (author, callback) {
  var ep = eventproxy.create();
  ep.fail(callback);
  mysql.query(LIST_BY_AUTH_SQLS[0], [author], ep.done(function (rows) {
    if (!rows || rows.length === 0) {
      return callback(null, []);
    }
    ep.emit('names', rows.map(function (r) {
      return r.name;
    }));
  }));
  ep.on('names', function (names) {
    mysql.query(LIST_BY_AUTH_SQLS[1], [names], ep.done(function (rows) {
      if (!rows || rows.length === 0) {
        return callback(null, []);
      }      
      ep.emit('ids', rows.map(function (r) {
        return r.module_id;
      }));
    }));
  });
  ep.on('ids', function (ids) {
    mysql.query(LIST_BY_AUTH_SQLS[2], [ids], callback);
  });
};

var SEARCH_SQLS = [
  'SELECT module_id FROM tag WHERE name LIKE ? AND  tag="latest" ORDER BY name LIMIT 100;',
  'SELECT name, description FROM module WHERE id IN (?) ORDER BY name;'
];
exports.search = function (word, callback) {
  word = word.replace(/^%/, '') + '%'; //ignore prefix %
  var ep = eventproxy.create();
  ep.fail(callback);
  mysql.query(SEARCH_SQLS[0], [word], ep.done(function (rows) {
    if (!rows || rows.length === 0) {
      return callback(null, []);
    }
    ep.emit('ids', rows.map(function (r) {
      return r.module_id;
    }));
  }));

  ep.on('ids', function (ids) {
    mysql.query(SEARCH_SQLS[1], [ids], ep.done(function (modules) {
      callback(null, modules);
    }));
  });
};
