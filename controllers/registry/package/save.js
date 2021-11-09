'use strict';

var debug = require('debug')('cnpmjs.org:controllers:registry:package:save');
var ssri = require('ssri');
var deprecateVersions = require('./deprecate');
var packageService = require('../../../services/package');
var logger = require('../../../common/logger');
var common = require('../../../lib/common');
var nfs = require('../../../common/nfs');
var config = require('../../../config');
var hook = require('../../../services/hook');

// old flows:
// 1. add()
// 2. upload()
// 3. updateLatest()
//
// new flows: only one request
// PUT /:name
// old publish: https://github.com/npm/npm-registry-client/blob/master/lib/publish.js#L84
// new publish: https://github.com/npm/libnpmpublish/blob/main/publish.js#L91
module.exports = function* save(next) {
  // 'dist-tags': { latest: '0.0.2' },
  //  _attachments:
  // { 'nae-sandbox-0.0.2.tgz':
  //    { content_type: 'application/octet-stream',
  //      data: 'H4sIAAAAA
  //      length: 9883
  var pkg = this.request.body;
  var username = this.user.name;
  var name = this.params.name || this.params[0];
  var filename = Object.keys(pkg._attachments || {})[0];
  var version = Object.keys(pkg.versions || {})[0];
  if (!version) {
    this.status = 400;
    const error = '[version_error] package.versions is empty';
    this.body = {
      error,
      reason: error,
    };
    return;
  }

  // check maintainers
  var result = yield packageService.authMaintainer(name, username);
  if (!result.isMaintainer) {
    this.status = 403;
    const error = '[forbidden] ' +  username + ' not authorized to modify ' + name +
      ', please contact maintainers: ' + result.maintainers.join(', ');
    this.body = {
      error,
      reason: error,
    };
    return;
  }

  if (!filename) {
    var hasDeprecated = false;
    for (var v in pkg.versions) {
      var row = pkg.versions[v];
      if (typeof row.deprecated === 'string') {
        hasDeprecated = true;
        break;
      }
    }
    if (hasDeprecated) {
      return yield deprecateVersions.call(this, next);
    }

    this.status = 400;
    const error = '[attachment_error] package._attachments is empty';
    this.body = {
      error,
      reason: error,
    };
    return;
  }

  var attachment = pkg._attachments[filename];
  var versionPackage = pkg.versions[version];
  var maintainers = versionPackage.maintainers;

  var authorizeType = common.getAuthorizeType(this);
  if (!maintainers) {
    if (authorizeType === common.AuthorizeType.BEARER) {
      // With the token mode, pub lib with no maintainers
      // make the maintainer to be puber
      maintainers = [{
        name: this.user.name,
        email: this.user.email,
      }];
    } else {
      // should never happened in normal request
      this.status = 400;
      const error = '[maintainers_error] request body need maintainers';
      this.body = {
        error,
        reason: error,
      };
      return;
    }
  }

  // notice that admins can not publish to all modules
  // (but admins can add self to maintainers first)

  var m = maintainers.filter(function (maintainer) {
    return maintainer.name === username;
  });

  // package.json has maintainers and publisher in not in the list
  if (authorizeType === common.AuthorizeType.BEARER && m.length === 0) {
    var publisher = {
      name: this.user.name,
      email: this.user.email,
    };
    m = [ publisher ];
    maintainers.push(publisher);
  }

  // make sure user in auth is in maintainers
  // should never happened in normal request
  if (m.length === 0) {
    this.status = 403;
    const error = '[maintainers_error] ' + username + ' does not in maintainer list';
    this.body = {
      error,
      reason: error,
    };
    return;
  }

  // TODO: add this info into some table
  versionPackage._publish_on_cnpm = true;
  var distTags = pkg['dist-tags'] || {};
  var tags = []; // tag, version
  for (var t in distTags) {
    tags.push([t, distTags[t]]);
  }

  if (tags.length === 0) {
    this.status = 400;
    const error = '[invalid] dist-tags should not be empty';
    this.body = {
      error,
      reason: error,
    };
    return;
  }

  debug('%s publish new %s:%s, attachment size: %s, maintainers: %j, distTags: %j',
    username, name, version, attachment.length, versionPackage.maintainers, distTags);

  var exists = yield packageService.getModule(name, version);
  if (exists) {
    this.status = 403;
    const error = '[forbidden] cannot modify pre-existing version: ' + version;
    this.body = {
      error,
      reason: error,
    };
    return;
  }

  // upload attachment
  var tarballBuffer;
  tarballBuffer = Buffer.from(attachment.data, 'base64');

  if (tarballBuffer.length !== attachment.length) {
    this.status = 403;
    const error = '[size_wrong] Attachment size ' + attachment.length
      + ' not match download size ' + tarballBuffer.length;
    this.body = {
      error,
      reason: error,
    };
    return;
  }

  if (!distTags.latest) {
    // need to check if latest tag exists or not
    var latest = yield packageService.getModuleByTag(name, 'latest');
    if (!latest) {
      // auto add latest
      tags.push(['latest', tags[0][1]]);
      debug('auto add latest tag: %j', tags);
    }
  }

  var originDist = versionPackage.dist || {};
  var shasum;
  var integrity = originDist.integrity;
  // for content security reason
  // check integrity
  if (integrity) {
    var algorithm = ssri.checkData(tarballBuffer, integrity);
    if (!algorithm) {
      logger.error('[registry:save:integrity:invalid] %s@%s, dist:%j', name, version, originDist);
      this.status = 400;
      const error = '[invalid] dist.integrity invalid';
      this.body = {
        error,
        reason: error,
      };
      return;
    }
    var integrityObj = ssri.fromData(tarballBuffer, {
      algorithms: ['sha1'],
    });
    shasum = integrityObj.sha1[0].hexDigest();
  } else {
    var integrityObj = ssri.fromData(tarballBuffer, {
      algorithms: ['sha512', 'sha1'],
    });
    integrity = integrityObj.sha512[0].toString();
    shasum = integrityObj.sha1[0].hexDigest();
    if (originDist.shasum && originDist.shasum !== shasum) {
      // if integrity not exists, check shasum
      logger.error('[registry:save:shasum:invalid] %s@%s, dist:%j', name, version, originDist);
      this.status = 400;
      const error = '[invalid] dist.shasum invalid';
      this.body = {
        error,
        reason: error,
      };
      return;
    }
  }
  
  var options = {
    key: common.getCDNKey(name, filename),
    shasum: shasum,
    integrity: integrity,
  };
  var uploadResult = yield nfs.uploadBuffer(tarballBuffer, options);
  debug('upload %j, options: %j', uploadResult, options);

  var dist = Object.assign({}, originDist, {
    tarball: '',
    integrity: integrity,
    shasum: shasum,
    size: attachment.length,
  });

  // if nfs upload return a key, record it
  if (uploadResult.url) {
    dist.tarball = uploadResult.url;
  } else if (uploadResult.key) {
    dist.key = uploadResult.key;
    dist.tarball = uploadResult.key;
  }

  var mod = {
    name: name,
    version: version,
    author: username,
    package: versionPackage
  };

  mod.package.dist = dist;
  yield addDepsRelations(mod.package);

  var addResult = yield packageService.saveModule(mod);
  debug('%s module: save file to %s, size: %d, sha1: %s, dist: %j, version: %s',
    addResult.id, dist.tarball, dist.size, shasum, dist, version);

  if (tags.length) {
    yield tags.map(function (tag) {
      // tag: [tagName, version]
      return packageService.addModuleTag(name, tag[0], tag[1]);
    });
  }

  // ensure maintainers exists
  var maintainerNames = maintainers.map(function (item) {
    return item.name;
  });
  yield packageService.addPrivateModuleMaintainers(name, maintainerNames);

  this.status = 201;
  this.body = {
    ok: true,
    rev: String(addResult.id)
  };

  // hooks
  const envelope = {
    event: 'package:publish',
    name: mod.name,
    type: 'package',
    version: mod.version,
    hookOwner: null,
    payload: null,
    change: null,
  };
  hook.trigger(envelope);
};

function* addDepsRelations(pkg) {
  var dependencies = Object.keys(pkg.dependencies || {});
  if (dependencies.length > config.maxDependencies) {
    dependencies = dependencies.slice(0, config.maxDependencies);
  }
  yield packageService.addDependencies(pkg.name, dependencies);
}
