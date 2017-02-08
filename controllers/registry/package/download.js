'use strict';

const debug = require('debug')('cnpmjs.org:controllers:registry:download');
const mime = require('mime');
const utility = require('utility');
const defer = require('co-defer');
const is = require('is-type-of');
const nfs = require('../../../common/nfs');
const logger = require('../../../common/logger');
const common = require('../../../lib/common');
const downloadAsReadStream = require('../../utils').downloadAsReadStream;
const packageService = require('../../../services/package');
const downloadTotalService = require('../../../services/download_total');
const config = require('../../../config');

let _downloads = {};

module.exports = function* download(next) {
  const name = this.params.name || this.params[0];
  const filename = this.params.filename || this.params[1];
  const version = filename.slice(name.length + 1, -4);
  const row = yield packageService.getModule(name, version);
  // can not get dist
  let url = null;

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

  const dist = row.package.dist;
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
  const totals = [];
  for (const name in _downloads) {
    const count = _downloads[name];
    totals.push([ name, count ]);
  }
  _downloads = {};

  if (totals.length === 0) {
    return;
  }

  debug('save download total: %j', totals);

  const date = utility.YYYYMMDD();
  for (let i = 0; i < totals.length; i++) {
    const item = totals[i];
    const name = item[0];
    const count = item[1];
    try {
      yield downloadTotalService.plusModuleTotal({ name, date, count });
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
