/*!
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
var urllib = require('urllib');
var urlparse = require('url').parse;
var config = require('../../config');
var Module = require('../../proxy/module');
var Total = require('../../proxy/total');
var nfs = require('../../common/nfs');
var npm = require('../../proxy/npm');

function getCDNKey(name, filename) {
  return '/' + name + '/-/' + filename;
}

exports.show = function (req, res, next) {
  var name = req.params.name;
  Module.listByName(name, function (err, rows) {
    if (err || rows.length === 0) {
      return next(err);
    }
    var nextMod = rows[0];
    var latest = rows[1];
    var startIndex = 1;
    if (nextMod.version !== 'next') {
      // next create fail
      latest = nextMod;
      startIndex = 0;
      nextMod = null;
    }

    if (!latest) {
      latest = nextMod;
    }

    var distTags = {};
    var versions = {};
    var times = {};
    var attachments = {};
    for (var i = startIndex; i < rows.length; i++) {
      var row = rows[i];
      var pkg = row.package;
      versions[pkg.version] = pkg;
      times[pkg.version] = row.gmt_modified;
    }

    if (latest.package.version && latest.package.version !== 'next') {
      distTags.latest = latest.package.version;
    }

    var rev = '';
    if (nextMod) {
      rev = String(nextMod.id);
    }

    var info = {
      _id: latest.name,
      _rev: rev,
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

exports.get = function (req, res, next) {
  var name = req.params.name;
  var version = req.params.version;
  Module.get(name, version, function(err, mod) {
    if (err || !mod) {
      return next(err);
    }
    res.json(mod.package);
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
        return res.json(403, {
          error: 'size_wrong',
          reason: 'Header size ' + length + ' not match download size ' + dataSize,
        });
      }
      shasum = shasum.digest('hex');
      var key = getCDNKey(name, filename);
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
  var version = req.params.version;
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
        email: req.session.email,
      };
    }
    nextMod.package = body;
    debug('update %s:%s %j', nextMod.package.name, nextMod.package.version, nextMod.package.dist);
    // change latest to version
    Module.update(nextMod, function (err) {
      if (err) {
        return next(err);
      }
      // add a new latest version
      nextMod.version = 'next';
      Module.add(nextMod, function (err, result) {
        if (err) {
          return next(err);
        }
        res.json(201, {ok: true, rev: String(result.id)});
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

    var key = getCDNKey(mod.name, filename);
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
  });

  ep.all('list', 'remove', function (mods) {
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

exports._syncModule = function (username, sourcePackage, callback) {
  var downurl = sourcePackage.dist.tarball;
  var filename = path.basename(downurl);
  var filepath = path.join(config.uploadDir, filename);
  var ws = fs.createWriteStream(filepath);
  var options = {
    writeStream: ws,
  };
  var ep = eventproxy.create();
  ep.fail(callback);

  var shasum = crypto.createHash('sha1');
  var dataSize = 0;
  urllib.request(downurl, options, ep.done(function (_, response) {
    var statusCode = response && response.statusCode || -1;
    if (statusCode !== 200) {
      var err = new Error('Download ' + downurl + ' fail, status: ' + statusCode);
      err.name = 'DownloadTarballError';
      err.data = sourcePackage;
      return ep.emit('error', err);
    }

    var rs = fs.createReadStream(filepath);
    rs.once('error', ep.fail.bind(ep));
    rs.on('data', function (data) {
      shasum.update(data);
      dataSize += data.length;
    });
    rs.on('end', function () {
      shasum = shasum.digest('hex');
      if (shasum !== sourcePackage.dist.shasum) {
        var err = new Error('Download ' + downurl + ' shasum:' + shasum + ' not match ' + sourcePackage.dist.shasum);
        err.name = 'DownloadTarballShasumError';
        err.data = sourcePackage;
        return ep.emit('error', err);
      }

      var key = getCDNKey(sourcePackage.name, filename);
      nfs.upload(filepath, {key: key, size: dataSize}, ep.done('uploadResult'));
    });
  }));

  ep.on('uploadResult', function (result) {
    // remove tmp file whatever
    fs.unlink(filepath, utility.noop);
    var mod = {
      version: sourcePackage.version,
      name: sourcePackage.name,
      package: sourcePackage,
      author: username,
    };
    var dist = {
      tarball: result.url,
      shasum: shasum,
      size: dataSize
    };
    mod.package.dist = dist;

    debug('sync %s, size: %d, sha1: %s, dist: %j, version: %s',
      downurl, dataSize, shasum, dist, mod.version);
    Module.add(mod, ep.done(function (result) {
      callback(null, result);
    }));
  });
};

exports.sync = function (req, res, next) {
  var username = req.session.name;
  var name = req.params.name;
  var ep = eventproxy.create();
  ep.fail(next);

  npm.get(name, ep.done(function (pkg, response) {
    if (!pkg._rev) {
      return res.json(response.statusCode, pkg);
    }
    ep.emit('sourcePackage', pkg);
  }));

  Module.listByName(name, ep.done(function (rows) {
    var map = {};
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (r.version === 'next') {
        continue;
      }
      map[r.version] = r;
    }
    ep.emit('existsMap', map);
  }));

  var missingVersions = [];
  ep.all('sourcePackage', 'existsMap', function (pkg, map) {
    var times = pkg.time || {};
    var versions = [];
    for (var v in times) {
      var exists = map[v];
      var version = pkg.versions[v];
      if (!version || !version.dist) {
        continue;
      }
      if (exists && exists.package.dist.shasum === version.shasum) {
        continue;
      }
      version.gmt_modified = Date.parse(times[v]);
      versions.push(version);
    }

    if (versions.length === 0) {
      return ep.emit('done');
    }

    versions.sort(function (a, b) {
      return a.gmt_modified - b.gmt_modified;
    });
    missingVersions = versions;
    ep.emit('syncVersion', missingVersions.shift());
  });

  ep.on('syncVersion', function (version) {
    exports._syncModule(username, version, ep.done(function (result) {
      var nextVersion = missingVersions.shift();
      if (!nextVersion) {
        return ep.emit('done', result);
      }
      ep.emit('syncVersion', nextVersion);
    }));
  });

  ep.on('done', function () {
    // TODO: set latest version
    res.json(201, {ok: true});
  });
};

function parseModsForList(mods) {
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
    results[mod.name] = pkg;
  }
  return results;
}

exports.listAllModules = function (req, res, next) {
  Module.listSince(new Date(0), function (err, mods) {
    if (err) {
      return next(err);
    }
    return res.json(parseModsForList(mods));
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
  var startkey = parseInt(query.startkey, 10) || 0;
  Module.listSince(new Date(startkey), function (err, mods) {
    if (err) {
      return next(err);
    }
    res.json(parseModsForList(mods));
  });
};

exports.listAllModuleNames = function (req, res, next) {
  Module.listSince(new Date(0), function (err, mods) {
    if (err) {
      return next(err);
    }
    var results = [];
    for (var i = 0; i < mods.length; i++) {
      results.push(mods[i].name);
    }
    res.json(results);
  });
};
