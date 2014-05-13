/**!
 * cnpmjs.org - sync/sync_dist.js
 *
 * Copyright(c) fengmk2 and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var debug = require('debug')('cnpmjs.org:sync:sync_dist');
var fs = require('fs');
var urllib = require('co-urllib');
var co = require('co');
var bytes = require('bytes');
var crypto = require('crypto');
var utility = require('utility');
var thunkify = require('thunkify-wrap');
var common = require('../lib/common');
var Dist = require('../proxy/dist');
var config = require('../config');
var nfs = require('../common/nfs');
var logger = require('../common/logger');

var disturl = config.disturl;
var USER_AGENT = 'distsync.cnpmjs.org/' + config.version + ' ' + urllib.USER_AGENT;

// <a href="latest/">latest/</a>                                            02-May-2014 14:45                   -
// <a href="node-v0.4.10.tar.gz">node-v0.4.10.tar.gz</a>                                26-Aug-2011 16:22            12410018
var FILE_RE = /^<a[^>]+>([^<]+)<\/a>\s+(\d+\-\w+\-\d+ \d+\:\d+)\s+([\-\d]+)/;

module.exports = sync;

function* sync(name) {
  name = name || '/';
  yield* syncDir(name);
}

function* syncDir(fullname, info) {
  var news = yield* listdiff(fullname);
  var files = [];
  var dirs = [];

  for (var i = 0; i < news.length; i++) {
    var item = news[i];
    if (item.type === 'dir') {
      dirs.push(item);
    } else {
      files.push(item);
    }
  }

  logger.info('sync remote:%s got %d new items, %d dirs, %d files to sync',
    fullname, news.length, dirs.length, files.length);

  for (var i = 0; i < files.length; i++) {
    yield* syncFile(files[i]);
  }

  for (var i = 0; i < dirs.length; i++) {
    var dir = dirs[i];
    yield* syncDir(dir.parent + dir.name, dir);
  }

  if (info) {
    logger.info('Save dir:%s %j to database', fullname, info);
    yield* Dist.savedir(info);
  }

  logger.info('Sync %s finished, %d dirs, %d files',
    fullname, dirs.length, files.length);
}

function* syncFile(info) {
  var name = info.parent + info.name;
  name = process.pid + name.replace(/\//g, '_'); // make sure no parent dir
  var downurl = disturl + info.parent + info.name;
  var filepath = common.getTarballFilepath(name);
  var ws = fs.createWriteStream(filepath);

  var options = {
    writeStream: ws,
    followRedirect: true,
    timeout: 6000000, // 100 minutes download
    headers: {
      'user-agent': USER_AGENT
    }
  };

  try {
    logger.info('downloading %s %s to %s', bytes(info.size), downurl, filepath);
    // get tarball
    var r = yield *urllib.request(downurl, options);
    var statusCode = r.status || -1;
    logger.info('download %s got status %s, headers: %j', downurl, statusCode, r.headers);
    if (statusCode !== 200) {
      var err = new Error('Download ' + downurl + ' fail, status: ' + statusCode);
      err.name = 'DownloadDistFileError';
      throw err;
    }

    var shasum = crypto.createHash('sha1');
    var dataSize = 0;
    var rs = fs.createReadStream(filepath);
    rs.on('data', function (data) {
      shasum.update(data);
      dataSize += data.length;
    });
    var end = thunkify.event(rs);
    yield end(); // after end event emit

    if (dataSize === 0) {
      var err = new Error('Download ' + downurl + ' file size is zero');
      err.name = 'DownloadDistFileZeroSizeError';
      throw err;
    }

    if (dataSize !== info.size) {
      var err = new Error('Download ' + downurl + ' file size is '
        + dataSize + ' not match ' + info.size);
      err.name = 'DownloadDistFileSizeError';
      throw err;
    }

    shasum = shasum.digest('hex');
    var args = {
      key: '/dist' + info.parent + info.name,
      size: info.size,
      shasum: shasum,
    };

    // upload to NFS
    logger.info('uploading %s to nfs:%s', filepath, args.key);
    var result = yield nfs.upload(filepath, args);
    info.url = result.url || result.key;
    info.sha1 = shasum;

    logger.info('upload %s to nfs:%s with size:%d, sha1:%s',
      args.key, info.url, info.size, info.sha1);
  } finally {
    // remove tmp file whatever
    fs.unlink(filepath, utility.noop);
  }

  logger.info('Sync dist file: %j done', info);
  yield* Dist.savefile(info);
}

function* listdir(fullname) {
  var url = disturl + fullname;
  var result = yield* urllib.request(url, {
    timeout: 60000,
  });
  debug('listdir %s got %s, %j', url, result.status, result.headers);
  var html = result.data && result.data.toString() || '';
  var lines = html.split('\n');
  var items = [];
  for (var i = 0; i < lines.length; i++) {
    var m = FILE_RE.exec(lines[i].trim());
    if (!m) {
      continue;
    }
    var itemName = m[1].replace(/^\/+/, '');
    if (!itemName) {
      continue;
    }

    // filter /nightlies/*
    if (itemName.indexOf('nightlies/') === 0) {
      continue;
    }

    items.push({
      name: itemName, // 'SHASUMS.txt', 'x64/'
      date: m[2],
      size: m[3] === '-' ? '-' : parseInt(m[3]),
      type: m[3] === '-' ? 'dir' : 'file',
      parent: fullname, // '/', '/v0.10.28/'
    });
  }
  return items;
}

function* listdiff(fullname) {
  var items = yield* listdir(fullname);
  if (items.length === 0) {
    return items;
  }
  var exists = yield* Dist.listdir(fullname);
  debug('listdiff %s got %s exists items', fullname, exists.length);
  var map = {};
  for (var i = 0; i < exists.length; i++) {
    var item = exists[i];
    map[item.name] = item;
  }
  var news = [];
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var exist = map[item.name];
    if (!exist || exist.date !== item.date || exist.size !== item.size) {
      news.push(item);
    } else {
      debug('skip %s', item.name);
    }
  }
  return news;
}
