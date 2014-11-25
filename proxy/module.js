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
/* jshint -W032 */

/**
 * Module dependencies.
 */

var thunkify = require('thunkify-wrap');
var utility = require('utility');
var eventproxy = require('eventproxy');
var config = require('../config');
var mysql = require('../common/mysql');
var multiline = require('multiline');

var INSERT_MODULE_SQL = multiline(function () {;/*
  INSERT INTO
    module(gmt_create, gmt_modified, publish_time, author, name, version,
      package, dist_tarball, dist_shasum, dist_size, description)
  VALUES
    (now(), now(), ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON DUPLICATE KEY UPDATE
    gmt_modified=now(),
    publish_time=VALUES(publish_time),
    description=VALUES(description),
    author=VALUES(author),
    name=VALUES(name),
    version=VALUES(version),
    package=VALUES(package),
    dist_tarball=VALUES(dist_tarball),
    dist_shasum=VALUES(dist_shasum),
    dist_size=VALUES(dist_size);
*/});

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
    publish_time,
    mod.author, // meaning first maintainer, more maintainers please check module_maintainer table
    mod.name, mod.version, pkg,
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

var GET_KEYWORD_SQL = multiline(function () {;/*
  SELECT
    keyword
  FROM
    module_keyword
  WHERE
    name = ?
  ORDER BY
    keyword;
*/});

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

var ADD_KEYWORD_SQL = multiline(function () {;/*
  INSERT INTO
    module_keyword(gmt_create, keyword, name, description)
  VALUES
    (now(), ?, ?, ?)
  ON DUPLICATE KEY UPDATE
    description=VALUES(description);
*/});

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

var UPDATE_DESC_SQL = multiline(function () {;/*
  UPDATE
    module
  SET
    description=?
  WHERE
    id=?;
*/});
exports.updateDescription = function (id, description, callback) {
  mysql.query(UPDATE_DESC_SQL, [description, id], callback);
};

var UPDATE_DIST_SQL = 'UPDATE module SET ? WHERE id=?';
exports.update = function (mod, callback) {
  var pkg;
  try {
    pkg = stringifyPackage(mod.package);
  } catch (e) {
    return callback(e);
  }
  var dist = mod.package.dist;

  var arg = {
    publish_time: mod.publish_time,
    version: mod.version,
    package: pkg,
    dist_tarball: dist.tarball,
    dist_shasum: dist.shasum,
    dist_size: dist.size
  };

  mysql.query(UPDATE_DIST_SQL,
    [arg, mod.id],
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


var SELECT_MODULE_BY_ID_SQL = multiline(function () {;/*
  SELECT
    id, publish_time, gmt_create, gmt_modified, author, name,
    version, description, package, dist_tarball, dist_shasum, dist_size
  FROM
    module
  WHERE
    id=?;
*/});
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

var SELECT_MODULE_SQL = multiline(function () {;/*
  SELECT
    id, publish_time, gmt_create, gmt_modified, author, name,
    version, description, package, dist_tarball, dist_shasum, dist_size
  FROM
    module
  WHERE
    name=? AND version=?;
*/});
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

var SELECT_MODULE_ID_SQL = multiline(function () {;/*
  SELECT
    id
  FROM
    module
  WHERE
    name=? AND version=?;
*/});
var INSERT_TAG_SQL = multiline(function () {;/*
  INSERT INTO
    tag(gmt_create, gmt_modified, name, tag, version, module_id)
  VALUES
    (now(), now(), ?, ?, ?, ?)
  ON DUPLICATE KEY UPDATE
    gmt_modified=now(),
    module_id=VALUES(module_id),
    name=VALUES(name),
    tag=VALUES(tag),
    version=VALUES(version);
*/});
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

var SELECT_TAG_SQL = multiline(function () {;/*
  SELECT
    tag, version, gmt_modified, module_id
  FROM
    tag
  WHERE
    name=? AND tag=?;
*/});
exports.getByTag = function (name, tag, callback) {
  mysql.queryOne(SELECT_TAG_SQL, [name, tag], function (err, row) {
    if (err || !row) {
      return callback(err, row);
    }
    exports.get(name, row.version, callback);
  });
};

var DELETE_TAGS_SQL = multiline(function () {;/*
  DELETE FROM
    tag
  WHERE
    name=?;
*/});
exports.removeTags = function (name, callback) {
  mysql.query(DELETE_TAGS_SQL, [name], callback);
};

var DELETE_TAGS_BY_IDS_SQL = multiline(function () {;/*
  DELETE FROM
    tag
  WHERE
    id IN (?);
*/});
exports.removeTagsByIds = function (ids, callback) {
  mysql.query(DELETE_TAGS_BY_IDS_SQL, [ids], callback);
};

var SELECT_ALL_TAGS_SQL = multiline(function () {;/*
  SELECT
    id, tag, version, gmt_modified, module_id
  FROM
    tag
  WHERE
    name=?;
*/});
exports.listTags = function (name, callback) {
  mysql.query(SELECT_ALL_TAGS_SQL, [name], callback);
};

var SELECT_LATEST_MODULE_SQL = multiline(function () {;/*
  SELECT
    id, publish_time, gmt_create, gmt_modified, author, name,
    version, description, package, dist_tarball, dist_shasum, dist_size
  FROM
    module
  WHERE
    name=? AND version <> "next"
  ORDER BY
    publish_time DESC
  LIMIT
    1;
*/});
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

var LIST_MODULE_SQL = multiline(function () {;/*
  SELECT
    id, publish_time, gmt_create, gmt_modified, author, name,
    version, description, package, dist_tarball, dist_shasum, dist_size
  FROM
    module
  WHERE
    name=?
  ORDER BY
    id DESC;
*/});
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

var LIST_SINCE_SQL = multiline(function () {;/*
  SELECT
    distinct(name)
  FROM
    tag
  WHERE
    gmt_modified > ?;
*/});
exports.listSince = function (start, callback) {
  mysql.query(LIST_SINCE_SQL, [new Date(start)], callback);
};

var LIST_ALL_NAME_SQL = multiline(function () {;/*
  SELECT
    distinct(name)
  FROM
    module;
*/});
exports.listAllNames = function (callback) {
  mysql.query(LIST_ALL_NAME_SQL, [], callback);
};

var LIST_SHORT_SQL = multiline(function () {;/*
  SELECT
    distinct(name)
  FROM
    tag
  ORDER BY
    name;
*/});
exports.listShort = function (callback) {
  mysql.query(LIST_SHORT_SQL, callback);
};

var LIST_ALL_MODULE_NAMES_SQL = multiline(function () {;/*
  SELECT
    distinct(name)
  FROM
    module
  ORDER BY
    name;
*/});
exports.listAllModuleNames = function (callback) {
  mysql.query(LIST_ALL_MODULE_NAMES_SQL, callback);
};

var DELETE_MODULE_BY_NAME_SQL = multiline(function () {;/*
  DELETE FROM
    module
  WHERE
    name=?;
*/});
exports.removeByName = function (name, callback) {
  mysql.query(DELETE_MODULE_BY_NAME_SQL, [name], callback);
};

var DELETE_MODULE_BY_NAME_AND_VERSIONS_SQL = multiline(function () {;/*
  DELETE FROM
    module
  WHERE
    name=? AND version in(?);
*/});
exports.removeByNameAndVersions = function (name, versions, callback) {
  mysql.query(DELETE_MODULE_BY_NAME_AND_VERSIONS_SQL, [name, versions], callback);
};

var SEARCH_MODULES_SQL = multiline(function () {;/*
  SELECT
    module_id
  FROM
    tag
  WHERE
    LOWER(name) LIKE LOWER(?) AND tag="latest"
  ORDER BY
    name
  LIMIT
    ?;
*/});
var SEARCH_MODULES_BY_KEYWORD_SQL = multiline(function () {;/*
  SELECT
    name, description
  FROM
    module_keyword
  WHERE
    keyword=?
  ORDER BY
    id DESC
  LIMIT
    ?;
*/});
var QUERY_MODULES_BY_ID_SQL = multiline(function () {;/*
  SELECT
    name, description
  FROM
    module
  WHERE
    id IN (?)
  ORDER BY
    name;
*/});
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

exports.searchByKeyword = function (keyword, options, callback) {
  var limit = options.limit || 100;
  mysql.query(SEARCH_MODULES_BY_KEYWORD_SQL, [ keyword, limit ], function(err, rows) {
    callback(null, rows);
  });
};

thunkify(exports);

var GET_LAST_MODIFIED_MODULE_SQL = multiline(function () {;/*
  SELECT
    id, gmt_modified
  FROM
    module
  WHERE
    name=?
  ORDER BY
    gmt_modified DESC
  LIMIT 1;
*/});
exports.getLastModified = function* (name) {
  var row = yield mysql.queryOne(GET_LAST_MODIFIED_MODULE_SQL, [name]);
  return row && row.gmt_modified;
};

var UPDATE_LAST_MODIFIED_SQL = 'UPDATE module SET gmt_modified=now() WHERE id=?;';
exports.updateLastModified = function* (name) {
  var row = yield mysql.queryOne(GET_LAST_MODIFIED_MODULE_SQL, [name]);
  if (row) {
    yield mysql.query(UPDATE_LAST_MODIFIED_SQL, [row.id]);
  }
};

var DELETE_TAGS_BY_NAMES_SQL = 'DELETE FROM tag WHERE name=? AND tag IN (?);';
exports.removeTagsByNames = function* (moduleName, tagNames) {
  return yield mysql.query(DELETE_TAGS_BY_NAMES_SQL, [moduleName, tagNames]);
};

/**
 * forward compatbility for update from lower version cnpmjs.org
 * redirect @scope/name => name
 */
exports.getAdaptName = function* (name) {
  if (!config.scopes
    || !config.scopes.length
    || !config.adaptScope) {
    return;
  }

  var tmp = name.split('/');
  var scope = tmp[0];
  name = tmp[1];

  if (config.scopes.indexOf(scope) === -1) {
    return;
  }

  var pkg = yield exports.getByTag(name, 'latest');
  // only private module can adapt
  if (pkg && pkg.package._publish_on_cnpm) {
    return name;
  }
  return;
};

exports.listPrivates = function* () {
  var scopes = config.scopes;
  if (!scopes || !scopes.length) {
    return [];
  }
  var privatePackages = config.privatePackages || [];

  var args = [];
  var sql = 'SELECT module_id AS id FROM tag WHERE tag="latest" AND (';
  var wheres = [];

  scopes.forEach(function (scope) {
    wheres.push('name LIKE ?');
    args.push(scope + '%');
  });

  if (privatePackages.length) {
    wheres.push('name in (?)');
    args.push(privatePackages);
  }

  sql = sql + wheres.join(' OR ') + ')';

  var ids = yield mysql.query(sql, args);
  ids = ids.map(function (row) {
    return row.id;
  });

  if (!ids.length) {
    return [];
  }

  return yield mysql.query(QUERY_MODULES_BY_ID_SQL, [ids]);
};

var LIST_BY_AUTH_SQLS = [];
LIST_BY_AUTH_SQLS.push(multiline(function () {;/*
  SELECT
    distinct(name) AS name
  FROM
    module
  WHERE
    author=?
  ORDER BY
    publish_time DESC
  LIMIT
    100;
*/}));
LIST_BY_AUTH_SQLS.push(multiline(function () {;/*
  SELECT
    name
  FROM
    module_maintainer
  WHERE
    user = ?
*/}));
LIST_BY_AUTH_SQLS.push(multiline(function () {;/*
  SELECT
    module_id
  FROM
    tag
  WHERE
    tag="latest" AND name IN (?);
*/}));
LIST_BY_AUTH_SQLS.push(multiline(function () {;/*
  SELECT
    name, description
  FROM
    module
  WHERE
    id IN (?)
  ORDER BY
    publish_time DESC;
*/}));
exports.listByAuthor = function* (author) {
  var names = yield [
    mysql.query(LIST_BY_AUTH_SQLS[0], [author]),
    mysql.query(LIST_BY_AUTH_SQLS[1], [author])
  ];

  names = names[0].concat(names[1]).map(function (n) {
    return n.name;
  }).sort();

  if (!names.length) {
    return [];
  }

  var ids = yield mysql.query(LIST_BY_AUTH_SQLS[2], [names]);
  if (!ids.length) {
    return [];
  }

  ids = ids.map(function (i) {
    return i.module_id;
  });
  return yield mysql.query(LIST_BY_AUTH_SQLS[3], [ids]);
};

exports.listNamesByAuthor = function* (author) {
  var sql = 'SELECT distinct(name) AS name FROM module WHERE author=?;';
  var names = yield mysql.query(sql, [author]);
  return names.map(function (item) {
    return item.name;
  });
};

var UPDATE_PACKAGE_SQL = multiline(function () {;/*
  UPDATE
    module
  SET
    package=?
  WHERE
    id=?;
*/});

exports.updatePackage = function* (id, pkg) {
  pkg = stringifyPackage(pkg);
  return yield mysql.query(UPDATE_PACKAGE_SQL, [pkg, id]);
};

exports.updatePackageFields = function* (id, fields) {
  var data = yield exports.getById(id);
  if (!data) {
    throw new Error('module#' + id + ' not exists');
  }
  data.package = data.package || {};
  for (var k in fields) {
    data.package[k] = fields[k];
  }
  return yield* exports.updatePackage(id, data.package);
};

exports.updateReadme = function* (id, readme) {
  var data = yield exports.getById(id);
  if (!data) {
    throw new Error('module#' + id + ' not exists');
  }
  data.package = data.package || {};
  data.package.readme = readme;
  return yield* exports.updatePackage(id, data.package);
};

exports.getTag = function* (name, tag) {
  return yield mysql.queryOne(SELECT_TAG_SQL, [name, tag]);
};
