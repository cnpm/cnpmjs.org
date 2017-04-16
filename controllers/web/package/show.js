'use strict';

var debug = require('debug')('cnpmjs.org:controllers:web:package:show');
var bytes = require('bytes');
var giturl = require('giturl');
var moment = require('moment');
var semver = require('semver');
var gravatar = require('gravatar');
var humanize = require('humanize-number');
var config = require('../../../config');
var utils = require('../../utils');
var setDownloadURL = require('../../../lib/common').setDownloadURL;
var renderMarkdown = require('../../../common/markdown').render;
var packageService = require('../../../services/package');

module.exports = function* show(next) {
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
    getPackageMethod = 'getModule';
    getPackageArgs = [name, version];
  } else {
    getPackageMethod = 'getModuleByTag';
    getPackageArgs = [name, tag || 'latest'];
  }

  var pkg = yield packageService[getPackageMethod].apply(packageService, getPackageArgs);
  if (!pkg || !pkg.package) {
    // check if unpublished
    var unpublishedInfo = yield packageService.getUnpublishedModule(name);
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
        package: data,
        title: 'Package - ' + name
      });
      return;
    }

    return yield next;
  }

  var r = yield [
    utils.getDownloadTotal(name),
    packageService.listDependents(name),
    packageService.listStarUserNames(name),
    packageService.listMaintainers(name)
  ];
  var download = r[0];
  var dependents = r[1];
  var users = r[2];
  var maintainers = r[3];

  pkg.package.fromNow = moment(pkg.publish_time).fromNow();
  pkg = pkg.package;
  pkg.users = users;
  if (!pkg.readme && config.enableAbbreviatedMetadata) {
    var packageReadme = yield packageService.getPackageReadme(name);
    if (packageReadme) {
      pkg.readme = packageReadme.readme;
    }
  }
  if (pkg.readme && typeof pkg.readme !== 'string') {
    pkg.readme = 'readme is not string: ' + JSON.stringify(pkg.readme);
  } else {
    pkg.readme = renderMarkdown(pkg.readme || '');
  }

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

  if (pkg._npmUser) {
    pkg.lastPublishedUser = pkg._npmUser;
    if (pkg.lastPublishedUser.email) {
      pkg.lastPublishedUser.gravatar = gravatar.url(pkg.lastPublishedUser.email, {s: '50', d: 'retro'}, true);
    }
  }

  if (pkg.repository === 'undefined') {
    pkg.repository = null;
  }
  if (pkg.repository && pkg.repository.url) {
    pkg.repository.weburl = /^https?:\/\//.test(pkg.repository.url) ? pkg.repository.url : (giturl.parse(pkg.repository.url) || pkg.repository.url);
  }
  if (!pkg.bugs) {
    pkg.bugs = {};
  }

  utils.setLicense(pkg);

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

  pkg.registryUrl = '//' + config.registryHost + '/' + pkg.name;

  // pkg.engines = {
  //   "python": ">= 0.11.9",
  //   "node": ">= 0.11.9",
  //   "node1": ">= 0.8.9",
  //   "node2": ">= 0.10.9",
  //   "node3": ">= 0.6.9",
  // };
  // "engines": "0.10.24",
  // invalid engines
  if (pkg.engines && typeof pkg.engines !== 'object') {
    pkg.engines = {};
  }

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
      badgeURL: config.badgePrefixURL + '/' + encodeURIComponent(k) +
        '-' + encodeURIComponent(engine) + '-' + color + '.svg?style=flat-square',
    };
  }

  if (pkg._publish_on_cnpm) {
    pkg.isPrivate = true;
  } else {
    pkg.isPrivate = false;
    // add security check badge
    pkg.snyk = {
      badge: `${config.snykUrl}/test/npm/${pkg.name}/badge.svg?style=flat-square`,
      url: `${config.snykUrl}/test/npm/${pkg.name}`,
    };
  }

  yield this.render('package', {
    title: 'Package - ' + pkg.name,
    package: pkg,
    download: download
  });
};
