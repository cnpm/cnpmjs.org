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

var debug = require('debug')('cnpmjs.org:controllers:web:package');
var bytes = require('bytes');
var giturl = require('giturl');
var moment = require('moment');
var semver = require('semver');
var marked = require('marked');
var gravatar = require('gravatar');
var humanize = require('humanize-number');
var config = require('../../config');
var down = require('../download');
var setDownloadURL = require('../../lib/common').setDownloadURL;
var packageService = require('../../services/package');

exports.display = function* (next) {
  var params = this.params;
  // normal: {name: $name, version: $version}
  // scope: [$name, $version]
  var orginalName = params.name || params[0];
  var name = orginalName;
  var tag = params.version || params[1];
  debug('display %s with %j', name, params);

  var getPackageMethod;
  var getPackageArgs;
  var version = semver.valid(tag || '');
  if (version) {
    getPackageMethod = 'get';
    getPackageArgs = [name, version];
  } else {
    getPackageMethod = 'getModuleByTag';
    getPackageArgs = [name, tag || 'latest'];
  }

  var pkg = yield Module[getPackageMethod].apply(Module, getPackageArgs);
  if (!pkg) {
    var adaptName = yield* Module.getAdaptName(name);
    if (adaptName) {
      name = adaptName;
      pkg = yield Module[getPackageMethod].apply(Module, [name, getPackageArgs[1]]);
    }
  }

  if (!pkg || !pkg.package) {
    // check if unpublished
    var unpublishedInfo = yield* ModuleUnpublished.get(name);
    debug('show unpublished %j', unpublishedInfo);
    if (unpublishedInfo) {
      var data = {
        name: name,
        unpublished: unpublishedInfo.package
      };
      data.unpublished.time = new Date(data.unpublished.time);
      if (data.unpublished.maintainers) {
        for (var i = 0; i < data.unpublished.maintainers.length; i++) {
          var maintainer = data.unpublished.maintainers[i];
          if (maintainer.email) {
            maintainer.gravatar = gravatar.url(maintainer.email, {s: '50', d: 'retro'}, true);
          }
        }
      }
      yield this.render('package_unpublished', {
        package: data
      });
      return;
    }

    return yield* next;
  }

  var r = yield [
    down.total(name),
    ModuleDeps.list(name),
    ModuleStar.listUsers(name),
    packageService.listMaintainers(name)
  ];
  var download = r[0];
  var dependents = (r[1] || []).map(function (item) {
    return item.deps;
  });
  var users = r[2];
  var maintainers = r[3];

  pkg.package.fromNow = moment(pkg.publish_time).fromNow();
  pkg = pkg.package;
  pkg.users = users;
  pkg.readme = marked(pkg.readme || '');
  if (!pkg.readme) {
    pkg.readme = pkg.description || '';
  }

  if (maintainers.length > 0) {
    pkg.maintainers = maintainers;
  }

  if (pkg.maintainers) {
    for (var i = 0; i < pkg.maintainers.length; i++) {
      var maintainer = pkg.maintainers[i];
      if (maintainer.email) {
        maintainer.gravatar = gravatar.url(maintainer.email, {s: '50', d: 'retro'}, true);
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
        contributor.gravatar = gravatar.url(contributor.email, {s: '50', d: 'retro'}, true);
      }
      if (config.packagePageContributorSearch || !contributor.url) {
        contributor.url = '/~' + encodeURIComponent(contributor.name);
      }
    }
  }

  if (pkg.repository && pkg.repository.url) {
    pkg.repository.weburl = giturl.parse(pkg.repository.url) || pkg.repository.url;
  }

  setLicense(pkg);

  for (var k in download) {
    download[k] = humanize(download[k]);
  }
  setDownloadURL(pkg, this, config.registryHost);

  pkg.dependents = dependents;

  if (pkg.dist) {
    pkg.dist.size = bytes(pkg.dist.size || 0);
  }

  if (pkg.name !== orginalName) {
    pkg.name = orginalName;
  }

  // pkg.engines = {
  //   "python": ">= 0.11.9",
  //   "node": ">= 0.11.9",
  //   "node1": ">= 0.8.9",
  //   "node2": ">= 0.10.9",
  //   "node3": ">= 0.6.9",
  // };
  if (pkg.engines) {
    for (var k in pkg.engines) {
      var engine = String(pkg.engines[k] || '').trim();
      var color = 'blue';
      if (k.indexOf('node') === 0) {
        color = 'yellowgreen';
        var version = /(\d+\.\d+\.\d+)/.exec(engine);
        if (version) {
          version = version[0];
          if (/^0\.11\.\d+/.test(version)) {
            color = 'red';
          } else if (/^0\.10\./.test(version) ||
              /^0\.12\./.test(version) ||
              /^0\.14\./.test(version) ||
              /^[^0]+\./.test(version)) {
            color = 'brightgreen';
          }
        }
      }
      pkg.engines[k] = {
        version: engine,
        title: k + ': ' + engine,
        badgeURL: 'https://img.shields.io/badge/' + encodeURIComponent(k) +
          '-' + encodeURIComponent(engine) + '-' + color + '.svg?style=flat-square',
      };
    }
  }

  yield this.render('package', {
    title: 'Package - ' + pkg.name,
    package: pkg,
    download: download
  });
};

exports.search = function *(next) {
  var params = this.params;
  var word = params.word || params[0];
  debug('search %j', word);
  var result = yield Module.search(word);

  var match = null;
  for (var i = 0; i < result.searchMatchs.length; i++) {
    var p = result.searchMatchs[i];
    if (p.name === word) {
      match = p;
      break;
    }
  }

  // return a json result
  if (this.query && this.query.type === 'json') {
    this.body = {
      keyword: word,
      match: match,
      packages: result.searchMatchs,
      keywords: result.keywordMatchs,
    };
    this.type = 'application/json; charset=utf-8';
    return;
  }
  yield this.render('search', {
    title: 'Keyword - ' + word,
    keyword: word,
    match: match,
    packages: result.searchMatchs,
    keywords: result.keywordMatchs,
  });
};

exports.rangeSearch = function *(next) {
  var startKey = this.query.startkey || '';
  if (startKey[0] === '"') {
    startKey = startKey.substring(1);
  }
  if (startKey[startKey.length - 1] === '"') {
    startKey = startKey.substring(0, startKey.length - 1);
  }
  var limit = Number(this.query.limit) || 20;
  var result = yield Module.search(startKey, {limit: limit});

  var packages = result.searchMatchs.concat(result.keywordMatchs);

  var rows = [];
  for (var i = 0; i < packages.length; i++) {
    var p = packages[i];
    var row = {
      key: p.name,
      count: 1,
      value: {
        name: p.name,
        description: p.description,
      }
    };
    rows.push(row);
  }
  this.body = {
    rows: rows
  };
};

exports.displaySync = function* (next) {
  var name = this.params.name || this.params[0] || this.query.name;
  yield this.render('sync', {
    name: name,
    title: 'Sync - ' + name,
  });
};

exports.listPrivates = function* () {
  var packages = yield Module.listPrivates();
  yield this.render('private', {
      title: 'private packages',
      packages: packages
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
