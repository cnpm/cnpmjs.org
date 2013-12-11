/*!
 * cnpmjs.org - controllers/web/package.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 */

'use strict';

/**
 * Module dependencies.
 */

var moment = require('moment');
var eventproxy = require('eventproxy');
var semver = require('semver');
var marked = require('marked');
var gravatar = require('gravatar');
var humanize = require('humanize-number');
var Module = require('../../proxy/module');
var down = require('../download');
var sync = require('../sync');
var Log = require('../../proxy/module_log');

exports.display = function (req, res, next) {
  var params = req.params;
  var name = params.name;
  var tag = params.version;
  var ep = eventproxy.create();
  ep.fail(next);

  if (tag) {
    var version = semver.valid(tag);
    if (version) {
      Module.get(name, version, ep.done('pkg'));
    } else {
      Module.getByTag(name, tag, ep.done('pkg'));
    }
  } else {
    Module.getByTag(name, 'latest', ep.done('pkg'));
  }

  down.total(name, ep.done('download'));

  ep.all('pkg', 'download', function (pkg, download) {
    if (!pkg || !pkg.package) {
      return next();
    }

    pkg.package.fromNow = moment(pkg.publish_time).fromNow();
    pkg = pkg.package;
    pkg.readme = marked(pkg.readme || '');
    if (pkg.maintainers) {
      for (var i = 0; i < pkg.maintainers.length; i++) {
        var maintainer = pkg.maintainers[i];
        if (maintainer.email) {
          maintainer.gravatar = gravatar.url(maintainer.email, {s: '50', d: 'retro'}, false);
        }
      }
    }

    setLicense(pkg);

    for (var k in download) {
      download[k] = humanize(download[k]);
    }

    res.render('package', {
      title: 'Package - ' + pkg.name,
      package: pkg,
      download: download
    });
  });
};

exports.search = function (req, res, next) {
  var params = req.params;
  var word = req.params.word;
  Module.search(word, function (err, packages) {
    if (err) {
      return next(err);
    }

    res.render('search', {
      title: 'Keyword - ' + word,
      keyword: word,
      packages: packages || []
    });
  });
};

exports.displaySync = function (req, res, next) {
  res.render('sync', {
    name: req.params.name
  });
};

exports.handleSync = function (req, res, next) {
  var name = req.params.name;
  sync(name, 'anonymous', function (err, result) {
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

function setLicense(pkg) {
  var license;
  license = pkg.license || pkg.licenses || pkg.licence || pkg.licences;
  if (!license) {
    return ;
  }

  if (Array.isArray(license)) {
    license = license[0];
  }

  if (typeof license === 'object') {
    pkg.license = {
      name: license.name || license.type,
      url: license.url
    };
  }

  if (typeof license === 'string') {
    if (license.match(/(http|https)(:\/\/)/ig)) {
      pkg.license = {
        name: license,
        url: license
      };
    } else {
      pkg.license = {
        url: getOssLicenseUrlFromName(license),
        name: license
      };
    }
  }
}

function getOssLicenseUrlFromName(name) {
  var base = 'http://opensource.org/licenses/';

  var licenseMap = {
    'bsd': 'BSD-2-Clause',
    'mit': 'MIT',
    'x11': 'MIT',
    'mit/x11': 'MIT',
    'apache 2.0': 'Apache-2.0',
    'apache2': 'Apache-2.0',
    'apache 2': 'Apache-2.0',
    'apache-2': 'Apache-2.0',
    'apache': 'Apache-2.0',
    'gpl': 'GPL-3.0',
    'gplv3': 'GPL-3.0',
    'gplv2': 'GPL-2.0',
    'gpl3': 'GPL-3.0',
    'gpl2': 'GPL-2.0',
    'lgpl': 'LGPL-2.1',
    'lgplv2.1': 'LGPL-2.1',
    'lgplv2': 'LGPL-2.1'
  };

  return licenseMap[name.toLowerCase()] ?
    base + licenseMap[name.toLowerCase()] : base + name;
}
