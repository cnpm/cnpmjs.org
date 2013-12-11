/**!
 * cnpmjs.org - controllers/registry/module.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  dead_horse <dead_horse@qq.com> (http://deadhorse.me)
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
var utility = require('utility');
var eventproxy = require('eventproxy');
var Bagpipe = require('bagpipe');
var urlparse = require('url').parse;
var config = require('../../config');
var Module = require('../../proxy/module');
var Total = require('../../proxy/total');
var nfs = require('../../common/nfs');
var common = require('../common');
var Log = require('../../proxy/module_log');
var DownloadTotal = require('../../proxy/download');
var sync = require('../sync');
var logger = require('../../common/logger');
var semver = require('semver');

exports.show = function (req, res, next) {
  var name = req.params.name;
  var ep = eventproxy.create();
  ep.fail(next);

  Module.listTags(name, ep.done('tags'));
  Module.listByName(name, ep.done('rows'));

  ep.all('tags', 'rows', function (tags, rows) {
    //if module not exist in this registry,
    //sync the module backend and return package info from official registry
    if (rows.length === 0) {
      if (!req.session.allowSync) {
        return next();
      }
      var username = (req.session && req.session.username) || 'anonymous';
      return sync(name, username, function (err, result) {
        if (err) {
          return next(err);
        }
        if (!result.ok) {
          return res.json(result.statusCode, result.pkg);
        }
        res.json(200, result.pkg);
      });
    }

    var nextMod = rows[0];
    var startIndex = 1;
    var latestMod = null;
    if (nextMod.version !== 'next') {
      // next create fail
      startIndex = 0;
      nextMod = null;
    }

    var distTags = {};
    for (var i = 0; i < tags.length; i++) {
      var t = tags[i];
      distTags[t.tag] = t.version;
    }

    var versions = {};
    var times = {};
    var attachments = {};
    for (var i = startIndex; i < rows.length; i++) {
      var row = rows[i];
      var pkg = row.package;
      common.downloadURL(pkg, req);
      versions[pkg.version] = pkg;
      times[pkg.version] = row.publish_time ? new Date(row.publish_time) : row.gmt_modified;
      if ((!distTags.latest && !latestMod) || distTags.latest === row.version) {
        latestMod = row;
      }
    }

    if (!latestMod) {
      latestMod = nextMod;
    }

    var rev = '';
    if (nextMod) {
      rev = String(nextMod.id);
    }

    var info = {
      _id: name,
      _rev: rev,
      name: name,
      description: latestMod.package.description,
      "dist-tags": distTags,
      maintainers: latestMod.package.maintainers,
      time: times,
      author: latestMod.package.author,
      repository: latestMod.package.repository,
      versions: versions,
      readme: latestMod.package.readme,
      _attachments: attachments,
    };

    res.json(info);
  });
};

exports.get = function (req, res, next) {
  var name = req.params.name;
  var tag = req.params.version;
  var version = semver.valid(tag);

  var ep = eventproxy.create();
  ep.fail(next);

  var method = version ? 'get' : 'getByTag';
  var queryLabel = version ? version : tag;

  Module[method](name, queryLabel, ep.done(function (mod) {
    if (mod) {
      common.downloadURL(mod.package, req);
      return res.json(mod.package);
    }
    ep.emit('notFound');
  }));

  ep.once('notFound', function () {
    if (!req.session.allowSync) {
      return next();
    }

    var username = (req.session && req.session.username) || 'anonymous';
    sync(name, username, function (err, result) {
      if (err) {
        return next(err);
      }
      var pkg = result.pkg.versions[version];
      if (!pkg) {
        return res.json(404, {
          error: 'not exist',
          reason: 'version not found: ' + version
        });
      }
      res.json(pkg);
    });
  });
};

var _downloads = {};

exports.download = function (req, res, next) {
  var name = req.params.name;
  var filename = req.params.filename;
  var cdnurl = nfs.url(common.getCDNKey(name, filename));
  res.statusCode = 302;
  res.setHeader('Location', cdnurl);
  res.end();
  _downloads[name] = (_downloads[name] || 0) + 1;
};

setInterval(function () {
  // save download count
  var totals = [];
  for (var name in _downloads) {
    var count = _downloads[name];
    totals.push([name, count]);
  }
  _downloads = {};

  if (totals.length === 0) {
    return;
  }

  debug('save download total: %j', totals);

  var date = utility.YYYYMMDD();
  var next = function () {
    var item = totals.shift();
    if (!item) {
      // done
      return;
    }

    DownloadTotal.plusTotal({name: item[0], date: date, count: item[1]}, function (err) {
      if (!err) {
        return next();
      }

      logger.error(err);
      debug('save download %j error: %s', item, err);

      totals.push(item);
      // save to _downloads
      for (var i = 0; i < totals.length; i++) {
        var v = totals[i];
        var name = v[0];
        _downloads[name] = (_downloads[name] || 0) + v[1];
      }
      // end
    });
  };
  next();
}, 5000);

exports.upload = function (req, res, next) {
  var length = Number(req.headers['content-length']) || 0;
  if (!length || req.headers['content-type'] !== 'application/octet-stream') {
    return next();
  }

  var username = req.session.name;
  var name = req.params.name;
  var id = Number(req.params.rev);
  var filename = req.params.filename;
  var version = filename.substring(name.length + 1);
  version = version.replace(/\.tgz$/, '');
  // save version on pkg upload

  debug('%s: upload %s, file size: %d', username, req.url, length);
  Module.getById(id, function (err, mod) {
    if (err || !mod) {
      return next(err);
    }
    var match = mod.package.maintainers.filter(function (item) {
      return item.name === username;
    });
    if (match.length === 0 || mod.name !== name) {
      return res.json(403, {
        error: 'no_perms',
        reason: 'Current user can not publish this module'
      });
    }

    if (mod.version !== 'next') {
      // rev wrong
      return res.json(403, {
        error: 'rev_wrong',
        reason: 'rev not match next module'
      });
    }

    var filepath = common.getTarballFilepath(filename);
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
        return res.json(403, {
          error: 'size_wrong',
          reason: 'Header size ' + length + ' not match download size ' + dataSize,
        });
      }
      shasum = shasum.digest('hex');
      var key = common.getCDNKey(name, filename);
      nfs.upload(filepath, {key: key, size: length}, function (err, result) {
        // remove tmp file whatever
        fs.unlink(filepath, utility.noop);
        if (err) {
          return next(err);
        }

        var dist = {
          tarball: result.url,
          shasum: shasum,
          size: length
        };
        mod.package.dist = dist;
        mod.package.version = version;
        debug('%s module: save file to %s, size: %d, sha1: %s, dist: %j, version: %s',
          id, filepath, length, shasum, dist, version);
        Module.update(mod, function (err, result) {
          if (err) {
            return next(err);
          }
          res.json(201, {ok: true, rev: String(result.id)});
        });
      });
    });
  });
};

exports.updateLatest = function (req, res, next) {
  var username = req.session.name;
  var name = req.params.name;
  var version = semver.valid(req.params.version);
  if (!version) {
    return res.json(400, {
      error: 'Params Invalid',
      reason: 'Invalid version: ' + req.params.version,
    });
  }
  Module.get(name, 'next', function (err, nextMod) {
    if (err) {
      return next(err);
    }
    if (!nextMod) {
      return next();
    }
    var match = nextMod.package.maintainers.filter(function (item) {
      return item.name === username;
    });
    if (match.length === 0) {
      return res.json(401, {
        error: 'noperms',
        reason: 'Current user can not publish this module'
      });
    }

    // check version if not match pkg upload
    if (nextMod.package.version !== version) {
      return res.json(403, {
        error: 'version_wrong',
        reason: 'version not match'
      });
    }

    var body = req.body;
    nextMod.version = version;
    nextMod.author = username;
    body.dist = nextMod.package.dist;
    body.maintainers = nextMod.package.maintainers;
    if (!body.author) {
      body.author = {
        name: username,
      };
    }
    nextMod.package = body;
    debug('update %s:%s %j', nextMod.package.name, nextMod.package.version, nextMod.package.dist);
    // change latest to version
    Module.update(nextMod, function (err) {
      if (err) {
        return next(err);
      }
      // set latest tag
      Module.addTag(name, 'latest', version, function (err) {
        if (err) {
          return next(err);
        }
        // add a new next version
        nextMod.version = 'next';
        Module.add(nextMod, function (err, result) {
          if (err) {
            return next(err);
          }
          res.json(201, {ok: true, rev: String(result.id)});
        });
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
    return res.json(403, {
      error: 'no_perms',
      reason: 'Current user can not publish this module'
    });
  }

  var ep = eventproxy.create();
  ep.fail(next);

  Module.getLatest(name, ep.doneLater('latest'));
  Module.get(name, 'next', ep.done(function (nextMod) {
    if (nextMod) {
      nextMod.exists = true;
      return ep.emit('next', nextMod);
    }
    // ensure next module exits
    // because updateLatest will create next module fail
    nextMod = {
      name: name,
      version: 'next',
      author: username,
      package: {
        name: name,
        version: 'next',
        description: pkg.description,
        readme: pkg.readme,
        maintainers: pkg.maintainers,
      },
    };
    Module.add(nextMod, ep.done(function (result) {
      nextMod.id = result.id;
      ep.emit('next', nextMod);
    }));
  }));

  ep.all('latest', 'next', function (latestMod, nextMod) {
    var maintainers = latestMod ? latestMod.package.maintainers : nextMod.package.maintainers;
    var match = maintainers.filter(function (item) {
      return item.name === username;
    });

    if (match.length === 0) {
      return res.json(403, {
        error: 'no_perms',
        reason: 'Current user can not publish this module'
      });
    }

    if (latestMod || nextMod.exists) {
      return res.json(409, {
        error: 'conflict',
        reason: 'Document update conflict.'
      });
    }

    res.json(201, {
      ok: true,
      id: name,
      rev: String(nextMod.id),
    });
  });
};

exports.removeWithVersions = function (req, res, next) {
  debug('removeWithVersions module %s, with info %j', req.params.name, req.body);
  var name = req.params.name;
  var username = req.session.name;
  var versions = req.body.versions || {};
  var ep = eventproxy.create();
  ep.fail(next);

  Module.listByName(name, ep.doneLater('list'));
  ep.once('list', function (mods) {
    if (!mods || !mods.length) {
      return next();
    }
    //TODO replace this maintainer check
    var match = mods[0].package.maintainers.filter(function (item) {
      return item.name === username;
    });

    if (!match.length || mods[0].name !== name) {
      return res.json(403, {
        error: 'no_perms',
        reason: 'Current user can not update this module'
      });
    }

    var removeVersions = [];
    for (var i = 0; i < mods.length; i++) {
      var v = mods[i].version;
      if (v !== 'next' && !versions[v]) {
        removeVersions.push(v);
      }
    }
    if (!removeVersions.length) {
      return res.json(201, {ok: true});
    }
    Module.removeByNameAndVersions(name, removeVersions, ep.done(function () {
      res.json(201, {ok: true});
    }));
  });
};


exports.removeTar = function (req, res, next) {
  debug('remove tarball with filename: %s, id: %s', req.params.filename, req.params.rev);
  var id = Number(req.params.rev);
  var filename = req.params.filename;
  var name = req.params.name;
  var username = req.session.name;
  var ep = eventproxy.create();
  ep.fail(next);

  Module.getById(id, ep.doneLater('get'));
  ep.once('get', function (mod) {
    if (!mod) {
      return next();
    }
    //TODO replace this maintainer check
    var match = mod.package.maintainers.filter(function (item) {
      return item.name === username;
    });
    if (!match.length || mod.name !== name) {
      return res.json(403, {
        error: 'no_perms',
        reason: 'Current user can not delete this tarball'
      });
    }

    var key = common.getCDNKey(mod.name, filename);
    nfs.remove(key, ep.done(function () {
      res.json(200, {ok: true});
    }));
  });
};

exports.removeAll = function (req, res, next) {
  debug('remove all the module with name: %s, id: %s', req.params.name, req.params.rev);
  var id = Number(req.params.rev);
  var name = req.params.name;
  var username = req.session.name;

  var ep = eventproxy.create();
  ep.fail(next);

  Module.listByName(name, ep.doneLater('list'));
  ep.once('list', function (mods) {
    var mod = mods[0];
    if (!mod) {
      return next();
    }
    //TODO replace this maintainer check
    var match = mod.package.maintainers.filter(function (item) {
      return item.name === username;
    });
    if (!match.length || mod.name !== name) {
      return res.json(403, {
        error: 'no_perms',
        reason: 'Current user can not delete this tarball'
      });
    }
    Total.plusDeleteModule(utility.noop);
    Module.removeByName(name, ep.done('remove'));
    Module.removeTags(name, ep.done('removeTags'));
  });

  ep.all('list', 'remove', 'removeTags', function (mods) {
    var keys = [];
    for (var i = 0; i < mods.length; i++) {
      var key = urlparse(mods[i].dist_tarball).path;
      key && keys.push(key);
    }
    var queue = new Bagpipe(5);
    keys.forEach(function (key) {
      queue.push(nfs.remove, key, function () {
        //ignore err here
        ep.emit('removeTar');
      });
    });
    ep.after('removeTar', keys.length, function () {
      res.json(200, {ok: true});
    });
  });
};

exports.sync = function (req, res, next) {
  var username = req.session.name;
  var name = req.params.name;
  sync(name, username, function (err, result) {
    if (err) {
      return next(err);
    }
    if (!result.ok) {
      return res.json(result.statusCode, result.pkg);
    }
    res.json(201, {
      ok: true,
      logId: result.logId
    });
  });
};

exports.getSyncLog = function (req, res, next) {
  var logId = req.params.id;
  var name = req.params.name;
  var offset = Number(req.query.offset) || 0;
  Log.get(logId, function (err, row) {
    if (err || !row) {
      return next(err);
    }
    var log = row.log.trim();
    if (offset > 0) {
      log = log.split('\n').slice(offset).join('\n');
    }
    res.json(200, {ok: true, log: log});
  });
};

function parseModsForList(mods, req) {
  var results = {
    _updated: Date.now()
  };

  for (var i = 0; i < mods.length; i++) {
    var mod = mods[i];
    var pkg = {};
    try {
      pkg = JSON.parse(mod.package);
    } catch (e) {
      //ignore this pkg
      continue;
    }
    pkg['dist-tags'] = {
      latest: pkg.version
    };
    common.downloadURL(pkg, req);
    results[mod.name] = pkg;
  }
  return results;
}

exports.listAllModules = function (req, res, next) {
  Module.listSince(new Date(0), function (err, mods) {
    if (err) {
      return next(err);
    }
    return res.json(parseModsForList(mods, req));
  });
};

exports.listAllModulesSince = function (req, res, next) {
  var query = req.query || {};
  if (query.stale !== 'update_after') {
    return res.json(400, {
      error: 'query_parse_error',
      reason: 'Invalid value for `stale`.'
    });
  }
  debug('list all modules from %s', req.startkey);
  var startkey = Number(query.startkey) || 0;
  Module.listSince(new Date(startkey), function (err, mods) {
    if (err) {
      return next(err);
    }
    res.json(parseModsForList(mods, req));
  });
};

exports.listAllModuleNames = function (req, res, next) {
  Module.listShort(function (err, mods) {
    if (err) {
      return next(err);
    }
    var results = mods.map(function (m) {
      return m.name;
    });
    res.json(results);
  });
};
