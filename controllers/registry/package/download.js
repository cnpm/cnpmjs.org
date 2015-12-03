/**!
 * Copyright(c) cnpm and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var debug = require('debug')('cnpmjs.org:controllers:registry:download');
var mime = require('mime');
var utility = require('utility');
var is = require('is-type-of');
var nfs = require('../../../common/nfs');
var logger = require('../../../common/logger');
var common = require('../../../lib/common');
var downloadAsReadStream = require('../../utils').downloadAsReadStream;
var packageService = require('../../../services/package');
var config = require('../../../config');

module.exports = function* download(next) {
  var name = this.params.name || this.params[0];
  var filename = this.params.filename || this.params[1];
  var version = filename.slice(name.length + 1, -4);
  var row = yield packageService.getModule(name, version);
  // can not get dist
  var url = null;

  if (typeof nfs.url === 'function') {
    if (is.generatorFunction(nfs.url)) {
      url = yield nfs.url(common.getCDNKey(name, filename));
    } else {
      url = nfs.url(common.getCDNKey(name, filename));
    }
  }

  debug('download %s %s %s %s', name, filename, version, url);

  if (!row || !row.package || !row.package.dist) {
    if (!url) {
      return yield* next;
    }
    this.status = 302;
    this.set('Location', url);
    return;
  }

  if (config.downloadRedirectToNFS && url) {
    this.status = 302;
    this.set('Location', url);
    return;
  }

  var dist = row.package.dist;
  if (!dist.key) {
    // try to use nsf.url() first
    url = url || dist.tarball;
    debug('get tarball by 302, url: %s', url);
    this.status = 302;
    this.set('Location', url);
    return;
  }

  // else use `dist.key` to get tarball from nfs
  if (typeof dist.size === 'number' && dist.size > 0) {
    this.length = dist.size;
  }
  this.type = mime.lookup(dist.key);
  this.attachment(filename);
  this.etag = dist.shasum;

  this.body = yield downloadAsReadStream(dist.key);
};


