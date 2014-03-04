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

var giturl = require('giturl');
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
var ModuleDeps = require('../../proxy/module_deps');
var setDownloadURL = require('../../lib/common').setDownloadURL;
var ModuleStar = require('../../proxy/module_star');

exports.display = function *(next) {
  var params = this.params;
  var name = params.name;
  var tag = params.version;

  var getPackageMethod;
  var getPackageArgs;
  var version = semver.valid(tag || '');
  if (version) {
    getPackageMethod = 'get';
    getPackageArgs = [name, version];
  } else {
    getPackageMethod = 'getByTag';
    getPackageArgs = [name, tag || 'latest'];
  }
  var r = yield [
    Module[getPackageMethod].apply(Module, getPackageArgs),
    down.total(name),
    ModuleDeps.list(name),
    ModuleStar.listUsers(name),
  ];
  var pkg = r[0];
  var download = r[1];
  var dependents = (r[2] || []).map(function (item) {
    return item.deps;
  });
  var users = r[3];

  if (!pkg || !pkg.package) {
    return yield next;
  }

  pkg.package.fromNow = moment(pkg.publish_time).fromNow();
  pkg = pkg.package;
  pkg.users = users;
  pkg.readme = marked(pkg.readme || '');
  if (!pkg.readme) {
    pkg.readme = pkg.description || '';
  }

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

  yield this.render('package', {
    title: 'Package - ' + pkg.name,
    package: pkg,
    download: download
  });
};

exports.search = function *(next) {
  var params = this.params;
  var word = params.word;
  var result = yield Module.search(word);
  // return a json result
  if (this.query && this.query.type === 'json') {
    this.body = {
      keyword: word,
      packages: result.searchMatchs,
      keywords: result.keywordMatchs
    };
    this.charset = 'utf-8';
    return;
  }

  yield this.render('search', {
    title: 'Keyword - ' + word,
    keyword: word,
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

exports.displaySync = function *(next) {
  var name = this.params.name || this.query.name;
  yield this.render('sync', {
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
