/*!
 * cnpmjs.org - controllers/registry/module.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  dead_horse <dead_horse@qq.com>
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var debug = require('debug')('cnpmjs.org:controllers:registry:module');
var path = require('path');
var fs = require('fs');
var crypto = require('crypto');
var config = require('../../config');
var Module = require('../../proxy/module');

exports.show = function (req, res, next) {
  var name = req.params.name;
  Module.listByName(name, function (err, rows) {
    if (err || rows.length === 0) {
      return next(err);
    }
    var latest;
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      if (row.version === 'latest') {
        latest = row;
        break;
      }
    }
    if (!latest) {
      return next();
    }

    var distTags = {};
    var versions = {};
    var times = {};
    var attachments = {};
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var pkg = row.package;
      if (!pkg.version || pkg.version === 'latest') {
        continue;
      }

      versions[pkg.version] = pkg;
      times[pkg.version] = row.gmt_modified;
    }

    if (latest.package.version || latest.package.version !== 'init') {
      distTags['latest'] = latest.package.version;
    }

    var info = {
      _id: latest.name,
      _rev: String(latest.id),
      name: latest.name,
      description: latest.package.description,
      versions: versions,
      "dist-tags": distTags,
      readme: latest.package.readme,
      maintainers: latest.package.maintainers,
      time: times,
      author: latest.package.author,
      repository: latest.package.repository,
      _attachments: attachments
    };

    res.json(info);
  });
};

exports.upload = function (req, res, next) {
  var length = Number(req.headers['content-length']) || 0;
  if (!length || req.headers['content-type'] !== 'application/octet-stream') {
    return next();
  }

  var username = req.session.name;
  var name = req.params.name;
  var id = Number(req.params.rev);
  var filename = req.params.filename;

  debug('%s: upload %s, file size: %d', username, req.url, length);
  Module.getById(id, function (err, mod) {
    if (err || !mod) {
      return next(err);
    }
    var match = mod.package.maintainers.filter(function (item) {
      return item.name === username;
    });
    if (match.length === 0 || mod.name !== name) {
      return res.json(401, {
        error: 'noperms',
        reason: 'Current user can not publish this module'
      });
    }

    var filepath = path.join(config.uploadDir, filename);
    var ws = fs.createWriteStream(filepath);
    var shasum = crypto.createHash('sha1');
    req.pipe(ws);
    var dataSize = 0;
    req.on('data', function (data) {
      shasum.update(data);
      dataSize += data.length;
    });
    ws.on('finish', function () {
      if (dataSize !== length) {
        return res.json(401, {
          error: 'wrongsize',
          reason: 'Header size ' + length + ' not match download size ' + dataSize,
        });
      }
      shasum = shasum.digest('hex');
      var dist = {
        tarball: 'http://' + req.headers.host + '/dist/' + filename,
        shasum: shasum,
        size: length
      };
      mod.package.dist = dist;
      debug('%s module: save file to %s, size: %d, sha1: %s, dist: %j', id, filepath, length, shasum, dist);
      Module.update(mod, function (err, result) {
        if (err) {
          return next(err);
        }
        res.json(201, {ok: true, rev: String(result.id), date: result.gmt_modified});
      });
    });
  });
};

exports.updateLatest = function (req, res, next) {
  var username = req.session.name;
  var name = req.params.name;
  var version = req.params.version;
  Module.get(name, 'latest', function (err, mod) {
    if (err) {
      return next(err);
    }
    if (!mod) {
      return next();
    }
    var match = mod.package.maintainers.filter(function (item) {
      return item.name === username;
    });
    if (match.length === 0) {
      return res.json(401, {
        error: 'noperms',
        reason: 'Current user can not publish this module'
      });
    }

    var body = req.body;

    mod.version = version;
    mod.author = username;
    body.dist = mod.package.dist;
    body.maintainers = mod.package.maintainers;
    if (!body.author) {
      body.author = {
        name: username,
        email: req.session.email,
      };
    }
    mod.package = body;
    debug('update %s:%s %j', mod.package.name, mod.package.version, mod.package.dist);
    // change latest to version
    Module.update(mod, function (err) {
      if (err) {
        return next(err);
      }
      // add a new latest version
      mod.version = 'latest';
      Module.add(mod, function (err, result) {
        if (err) {
          return next(err);
        }
        res.json(201, {ok: true, rev: String(result.id), date: result.gmt_modified});
      });
    });
  });
};

exports.add = function (req, res, next) {
  var username = req.session.name;
  var name = req.params.name;
  var pkg = req.body;
  var maintainers = pkg.maintainers || [];
  var match = maintainers.filter(function (item) {
    return item.name === username;
  });
  if (match.length === 0) {
    return res.json(401, {
      error: 'noperms',
      reason: 'Current user can not publish this module'
    });
  }

  Module.get(name, 'latest', function (err, mod) {
    if (err) {
      return next(err);
    }

    if (mod) {
      match = mod.package.maintainers.filter(function (item) {
        return item.name === username;
      });
      if (match.length === 0) {
        return res.json(401, {
          error: 'noperms',
          reason: 'Current user can not publish this module'
        });
      }

      return res.json(409, {
        error: 'conflict',
        reason: 'Document update conflict.'
      });
    }

    mod = {
      name: name,
      version: 'latest',
      author: username,
      package: {
        name: name,
        version: 'init',
        description: pkg.description,
        readme: pkg.readme,
        maintainers: pkg.maintainers,
        author: {
          name: username,
          email: req.session.email,
        }
      },
    };
    Module.add(mod, function (err, result) {
      if (err) {
        return next(err);
      }
      res.json(201, {
        ok: true,
        id: name,
        rev: String(result.id),
      });
    });
  });
};
