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
var defer = require('co-defer');
var is = require('is-type-of');
var nfs = require('../../../common/nfs');
var logger = require('../../../common/logger');
var common = require('../../../lib/common');
var downloadAsReadStream = require('../../utils').downloadAsReadStream;
var packageService = require('../../../services/package');
var downloadTotalService = require('../../../services/download_total');
var config = require('../../../config');

var _downloads = {};

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
      return yield next;
    }
    this.status = 302;
    this.set('Location', url);
    _downloads[name] = (_downloads[name] || 0) + 1;
    return;
  }

  _downloads[name] = (_downloads[name] || 0) + 1;

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

defer.setInterval(function* () {
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
  for (var i = 0; i < totals.length; i++) {
    var item = totals[i];
    var name = item[0];
    var count = item[1];
    try {
      yield downloadTotalService.plusModuleTotal({ name: name, date: date, count: count });
    } catch (err) {
      if (err.name !== 'SequelizeUniqueConstraintError') {
        err.message += '; name: ' + name + ', count: ' + count + ', date: ' + date;
        logger.error(err);
      }
      // save back to _downloads, try again next time
      _downloads[name] = (_downloads[name] || 0) + count;
    }
  }
}, 5000 + Math.ceil(Math.random() * 1000));
