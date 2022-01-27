'use strict';

const debug = require('debug')('cnpmjs.org:controllers:web:package:showWithRemote');
const moment = require('moment');
const gravatar = require('gravatar');
const giturl = require('giturl');
const urllib = require('../../../common/urllib');
const config = require('../../../config');
const renderMarkdown = require('../../../common/markdown').render;

module.exports = function* showWithRemote(ctx, next) {
  const params = ctx.params;
  const fullname = params.name || params[0];
  const versionOrTag = params.version || params[1] || 'latest';
  debug('display %s with %j', fullname, params);

  const url = `${config.webDataRemoteRegistry}/${fullname}`;
  const result = yield urllib.request(url, {
    dataType: 'json',
    timeout: 20000,
    followRedirect: true,
    gzip: true,
  });
  if (result.status !== 200) {
    return yield next;
  }
  const manifest = result.data;

  const distTags = manifest['dist-tags'] || {};
  const realVersion = distTags[versionOrTag] || versionOrTag;
  const versionsMap = manifest.versions || {};
  const pkg = versionsMap[realVersion];
  if (!pkg) {
    return yield next;
  }

  const maintainers = manifest.maintainers;
  if (maintainers) {
    for (const maintainer of maintainers) {
      if (maintainer.email) {
        maintainer.gravatar = gravatar.url(maintainer.email, {s: '50', d: 'retro'}, true);
      }
    }
    pkg.maintainers = maintainers;
  }

  const timeMap = manifest.time || {};
  
  pkg.readme = manifest.readme || '';
  if (typeof pkg.readme !== 'string') {
    pkg.readme = 'readme is not string: ' + JSON.stringify(pkg.readme);
  } else {
    pkg.readme = renderMarkdown(pkg.readme);
  }
  
  pkg.fromNow = moment(new Date(timeMap[pkg.version])).fromNow();
  // [ {tag, version, fromNow} ]
  const tags = [];
  for (const tag in distTags) {
    const version = distTags[tag];
    const time = timeMap[version];
    if (time) {
      const fromNow = moment(new Date(time)).fromNow();
      tags.push({ tag, version, fromNow });
    }
  }
  pkg.tags = tags;
  // [ {version, deprecated, fromNow} ]
  const versions = [];
  for (const version in versionsMap) {
    const item = versionsMap[version];
    versions.push({
      version,
      deprecated: item.deprecated,
      fromNow: moment(new Date(timeMap[version])).fromNow(),
    });
  }
  pkg.versions = versions;

  pkg.registryUrl = '//' + config.registryHost + '/' + pkg.name;
  pkg.registryPackageUrl = '//' + config.registryHost + '/' + pkg.name + '/' + pkg.version;

  if (pkg.repository === 'undefined') {
    pkg.repository = null;
  }
  if (pkg.repository && pkg.repository.url) {
    if (!pkg.repository.weburl) {
      pkg.repository.weburl = /^https?:\/\//.test(pkg.repository.url) ? pkg.repository.url : (giturl.parse(pkg.repository.url) || pkg.repository.url);
    }
  }

  yield ctx.render('package', {
    title: 'Package - ' + manifest.name,
    package: pkg,
    download: null,
  });
};
