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
var config = require('../../config');
var Module = require('../../proxy/module');
var down = require('../download');
var sync = require('../sync');
var Log = require('../../proxy/module_log');
var setDownloadURL = require('../../lib/common').setDownloadURL;

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

    if (pkg.contributors) {
      // registry.cnpmjs.org/compressible
      if (!Array.isArray(pkg.contributors)) {
        pkg.contributors = [pkg.contributors];
      }
      for (var i = 0; i < pkg.contributors.length; i++) {
        var contributor = pkg.contributors[i];
        if (contributor.email) {
          contributor.gravatar = gravatar.url(contributor.email, {s: '50', d: 'retro'}, false);
        }
      }
    }

    setLicense(pkg);

    for (var k in download) {
      download[k] = humanize(download[k]);
    }

    setDownloadURL(pkg, req, config.registryHost);

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
  var name = req.params.name;
  res.render('sync', {
    name: name,
    title: 'Sync - ' + name
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
exports.setLicense = setLicense;

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
