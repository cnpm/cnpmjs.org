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

var thunkify = require('thunkify-wrap');
var utility = require('utility');
var eventproxy = require('eventproxy');
var config = require('../config');
var mysql = require('../common/mysql');

var MODULE_COLUMNS = 'id, publish_time, gmt_create, gmt_modified, author, name, version, description, package, dist_tarball, dist_shasum, dist_size';

var INSERT_MODULE_SQL = 'INSERT INTO module(gmt_create, gmt_modified, \
  publish_time, author, name, version, package, dist_tarball, dist_shasum, dist_size, description) \
  VALUES(now(), now(), ?, ?, ?, ?, ?, ?, ?, ?, ?) \
  ON DUPLICATE KEY UPDATE gmt_modified=now(), publish_time=VALUES(publish_time), description=VALUES(description), \
    author=VALUES(author), name=VALUES(name), version=VALUES(version), package=VALUES(package), \
    dist_tarball=VALUES(dist_tarball), dist_shasum=VALUES(dist_shasum), dist_size=VALUES(dist_size);';

exports.add = function (mod, callback) {
  var keywords = mod.package.keywords;
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

    if (typeof keywords === 'string') {
      keywords = [keywords];
    }

    if (!Array.isArray(keywords)) {
      return;
    }

    var words = [];
    for (var i = 0; i < keywords.length; i++) {
      var w = keywords[i];
      if (typeof w === 'string') {
        w = w.trim();
        if (w) {
          words.push(w);
        }
      }
    }

    if (words.length === 0) {
      return;
    }

    // add keywords
    exports.addKeywords(mod, description, words, utility.noop);
  });
};

var GET_KEYWORD_SQL = 'SELECT keyword FROM module_keyword WHERE name=? ORDER BY keyword;';

exports.getKeywords = function (name, callback) {
  mysql.query(GET_KEYWORD_SQL, [name], function (err, rows) {
    var keywords = [];
    if (rows && rows.length) {
      keywords = rows.map(function (r) {
        return r.keyword;
      });
    }
    callback(err, keywords);
  });
};

var ADD_KEYWORD_SQL = 'INSERT INTO module_keyword(gmt_create, keyword, name, description) \
  VALUES(now(), ?, ?, ?) \
  ON DUPLICATE KEY UPDATE description=VALUES(description);';

exports.addKeywords = function (name, description, keywords, callback) {
  var sql = '';
  var values = [];
  for (var i = 0; i < keywords.length; i++) {
    sql += ADD_KEYWORD_SQL;
    values.push(keywords[i]);
    values.push(name);
    values.push(description);
  }
  mysql.query(sql, values, function (err, results) {
    if (err) {
      return callback(err);
    }
    var ids = [];
    for (var i = 0; i < results.length; i++) {
      var r = results[i];
      if (r.insertId) {
        ids.push(r.insertId);
      }
    }
    callback(null, ids);
  });
};

var UPDATE_DESC_SQL = 'UPDATE module SET description=? WHERE id=?;';
exports.updateDescription = function (id, description, callback) {
  mysql.query(UPDATE_DESC_SQL, [description, id], callback);
};

var UPDATE_PACKAGE_SQL = 'UPDATE module SET package=? WHERE id=?;';
exports.updateReadme = function (id, readme, callback) {
  exports.getById(id, function (err, data) {
    if (err) {
      return callback(err);
    }
    data.package = data.package || {};
    data.package.readme = readme;
    var pkg = stringifyPackage(data.package);
    mysql.query(UPDATE_PACKAGE_SQL, [pkg, id], callback);
  });
};

var UPDATE_DIST_SQL = 'UPDATE module SET publish_time=?, version=?, package=?, \
  dist_tarball=?, dist_shasum=?, dist_size=? WHERE id=?;';

exports.update = function (mod, callback) {
  var pkg;
  try {
    pkg = stringifyPackage(mod.package);
  } catch (e) {
    return callback(e);
  }
  var dist = mod.package.dist;
  mysql.query(UPDATE_DIST_SQL,
    [mod.publish_time, mod.version, pkg, dist.tarball, dist.shasum, dist.size, mod.id],
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
exports.parseRow = parseRow;

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

var DELETE_TAGS_BY_IDS_SQL = 'DELETE FROM tag WHERE id in (?)';
exports.removeTagsByIds = function (ids, callback) {
  mysql.query(DELETE_TAGS_BY_IDS_SQL, [ids], callback);
};

var SELECT_ALL_TAGS_SQL = 'SELECT id, tag, version, gmt_modified, module_id FROM tag WHERE name=?;';

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
  'SELECT module_id FROM tag WHERE tag="latest" AND gmt_modified>?',
  'SELECT name, package FROM module WHERE id IN (?);'
];
exports.listSince = function (start, callback) {
  var ep = eventproxy.create();
  ep.fail(callback);
  mysql.query(LIST_SINCE_SQLS[0], [new Date(start)], ep.done(function (rows) {
    if (!rows || rows.length === 0) {
      return callback(null, []);
    }
    ep.emit('ids', rows.map(function (r) {
      return r.module_id;
    }));
  }));

  ep.once('ids', function (ids) {
    mysql.query(LIST_SINCE_SQLS[1], [ids], callback);
  });
};

var LIST_SHORT_SQL = 'SELECT distinct(name) FROM tag ORDER BY name';
exports.listShort = function (callback) {
  mysql.query(LIST_SHORT_SQL, callback);
};

var LIST_ALL_MODULE_NAMES_SQL = 'SELECT distinct(name) FROM module ORDER BY name';
exports.listAllModuleNames = function (callback) {
  mysql.query(LIST_ALL_MODULE_NAMES_SQL, callback);
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

var SEARCH_MODULES_SQL = 'SELECT module_id FROM tag WHERE name LIKE ? AND tag="latest" ORDER BY name LIMIT ?;';
var SEARCH_MODULES_BY_KEYWORD_SQL = 'SELECT name, description FROM module_keyword WHERE keyword = ? ORDER BY id DESC LIMIT ?;';
var QUERY_MODULES_BY_ID_SQL = 'SELECT name, description FROM module WHERE id IN (?) ORDER BY name;';

exports.search = function (word, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = null;
  }
  options = options || {};
  var limit = options.limit || 100;
  word = word.replace(/^%/, ''); //ignore prefix %
  var ep = eventproxy.create();
  ep.fail(callback);

  // search flows:
  // 1. prefix search by name
  // 2. like search by name
  // 3. keyword equal search
  var ids = {};

  mysql.query(SEARCH_MODULES_SQL, [word + '%', limit ], ep.done(function (rows) {
    rows = rows || [];
    if (rows.length > 0) {
      for (var i = 0; i < rows.length; i++) {
        ids[rows[i].module_id] = 1;
      }
    }
    if (rows.length >= 20) {
      return ep.emit('ids', Object.keys(ids));
    }

    mysql.query(SEARCH_MODULES_SQL, [ '%' + word + '%', limit ], ep.done('likeSearch'));
  }));

  mysql.query(SEARCH_MODULES_BY_KEYWORD_SQL, [ word, limit ], ep.done('keywordRows'));

  ep.on('likeSearch', function (rows) {
    rows = rows || [];
    if (rows.length > 0) {
      for (var i = 0; i < rows.length; i++) {
        ids[rows[i].module_id] = 1;
      }
    }

    ep.emit('ids', Object.keys(ids));
  });

  ep.all('ids', 'keywordRows', function (ids, keywordRows) {
    keywordRows = keywordRows || [];
    var data = {
      keywordMatchs: keywordRows,
      searchMatchs: []
    };
    if (ids.length === 0) {
      return callback(null, data);
    }

    mysql.query(QUERY_MODULES_BY_ID_SQL, [ids], ep.done(function (modules) {
      data.searchMatchs = modules;
      callback(null, data);
    }));
  });
};

thunkify(exports);
