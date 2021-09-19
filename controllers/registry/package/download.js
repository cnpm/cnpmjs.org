'use strict';

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

let globalDownloads = new Map();

module.exports = function* download(next) {
  var name = this.params.name || this.params[0];
  var filename = this.params.filename || this.params[1];
  // scope pkg and download with out scope
  if (name.startsWith('@') && !filename.startsWith('@')) {
    var scope = name.slice(0, name.indexOf('/'));
    // fix filename with scope
    filename = `${scope}/${filename}`;
  }


  var version = filename.slice(name.length + 1, -4);
  // can not get dist
  var url = null;

  var query = this.query || {};
  // allow download from specific store bucket
  var options = query.bucket ? { bucket: query.bucket } : null;

  if (typeof nfs.url === 'function') {
    if (is.generatorFunction(nfs.url)) {
      url = yield nfs.url(common.getCDNKey(name, filename), options);
    } else {
      url = nfs.url(common.getCDNKey(name, filename), options);
    }
  }

  debug('download %s %s %s %s', name, filename, version, url);
  // don't check database and just download tgz from nfs
  if (config.downloadTgzDontCheckModule && url) {
    this.status = 302;
    this.set('Location', url);
    const count = (globalDownloads.get(name) || 0) + 1;
    globalDownloads.set(name, count);
    return;
  }

  var row = yield packageService.getModule(name, version);
  if (!row || !row.package || !row.package.dist) {
    if (!url) {
      return yield next;
    }
    this.status = 302;
    this.set('Location', url);
    const count = (globalDownloads.get(name) || 0) + 1;
    globalDownloads.set(name, count);
    return;
  }

  const count = (globalDownloads.get(name) || 0) + 1;
  globalDownloads.set(name, count);

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

var saving = false;
defer.setInterval(function* () {
  if (saving) {
    return;
  }

  // save download count
  var totals = [];
  var allCount = 0;
  for (const [ name, count ] of globalDownloads) {
    if (name !== '__all__') {
      totals.push([name, count]);
    }
    allCount += count;
  }
  globalDownloads = new Map();

  if (allCount === 0) {
    return;
  }

  saving = true;
  totals.push([ '__all__', allCount ]);
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
      // save back to globalDownloads, try again next time
      count = (globalDownloads.get(name) || 0) + count;
      globalDownloads.set(name, count);
    }
  }
  saving = false;
}, 5000 + Math.ceil(Math.random() * 1000));
