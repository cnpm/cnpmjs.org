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
var cheerio = require('cheerio');
var urlResolve = require('url').resolve;
var common = require('../lib/common');
var Dist = require('../proxy/dist');
var config = require('../config');
var nfs = require('../common/nfs');
var logger = require('../common/logger');

var disturl = config.disturl;
var USER_AGENT = 'distsync.cnpmjs.org/' + config.version + ' ' + urllib.USER_AGENT;

module.exports = sync;

function* sync(name) {
  name = name || '/';
  yield* syncDir(name);
}

function* syncDir(fullname, info) {
  var news = yield* sync.listdiff(fullname);
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

  logger.syncInfo('sync remote:%s got %d new items, %d dirs, %d files to sync',
    fullname, news.length, dirs.length, files.length);

  for (var i = 0; i < files.length; i++) {
    yield* syncFile(files[i]);
  }

  for (var i = 0; i < dirs.length; i++) {
    var dir = dirs[i];
    yield* syncDir(dir.parent + dir.name, dir);
  }

  if (info) {
    logger.syncInfo('Save dir:%s %j to database', fullname, info);
    yield* Dist.savedir(info);
  }

  logger.syncInfo('Sync %s finished, %d dirs, %d files',
    fullname, dirs.length, files.length);
}

function* syncFile(info) {
  var name = info.parent + info.name;
  name = process.pid + name.replace(/\//g, '_'); // make sure no parent dir
  var isPhantomjsURL = false;
  var downurl = disturl + info.parent + info.name;
  if (info.downloadURL) {
    downurl = info.downloadURL;
    isPhantomjsURL = true;
  }
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
    logger.syncInfo('downloading %s %s to %s, isPhantomjsURL: %s',
      bytes(info.size), downurl, filepath, isPhantomjsURL);
    // get tarball
    var r = yield *urllib.request(downurl, options);
    var statusCode = r.status || -1;
    logger.syncInfo('download %s got status %s, headers: %j',
      downurl, statusCode, r.headers);
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

    if (isPhantomjsURL) {
      debug('real size: %s, expect size: %s', dataSize, info.size);
      if (dataSize < info.size) {
        // phantomjs download page only show `6.7 MB`
        var err = new Error('Download ' + downurl + ' file size is '
          + dataSize + ' not match ' + info.size);
        err.name = 'DownloadDistFileSizeError';
        throw err;
      }
      info.size = dataSize;
    } else if (dataSize !== info.size) {
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
    logger.syncInfo('uploading %s to nfs:%s', filepath, args.key);
    var result = yield nfs.upload(filepath, args);
    info.url = result.url || result.key;
    info.sha1 = shasum;

    logger.syncInfo('upload %s to nfs:%s with size:%d, sha1:%s',
      args.key, info.url, info.size, info.sha1);
  } finally {
    // remove tmp file whatever
    fs.unlink(filepath, utility.noop);
  }

  logger.syncInfo('Sync dist file: %j done', info);
  yield* Dist.savefile(info);
}

// <a href="latest/">latest/</a>                                            02-May-2014 14:45                   -
// <a href="node-v0.4.10.tar.gz">node-v0.4.10.tar.gz</a>                                26-Aug-2011 16:22            12410018
var FILE_RE = /^<a[^>]+>([^<]+)<\/a>\s+(\d+\-\w+\-\d+ \d+\:\d+)\s+([\-\d]+)/;

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

sync.listdiff = function* (fullname) {
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
    if (!exist || exist.date !== item.date) {
      news.push(item);
      continue;
    }

    if (item.size !== '-' && item.size !== exist.size) {
      news.push(item);
      continue;
    }

    debug('skip %s', item.name);
  }
  return news;
};

function* syncPhantomjsDir() {
  var fullname = '/phantomjs/';
  var files = yield* sync.listPhantomjsDiff(fullname);

  logger.syncInfo('sync remote:%s got %d files to sync',
    fullname, files.length);

  for (var i = 0; i < files.length; i++) {
    yield* syncFile(files[i]);
  }

  logger.syncInfo('SyncPhantomjsDir %s finished, %d files',
    fullname, files.length);
}
sync.syncPhantomjsDir = syncPhantomjsDir;

// <tr class="iterable-item" id="download-301626">
//   <td class="name"><a class="execute" href="/ariya/phantomjs/downloads/phantomjs-1.9.7-windows.zip">phantomjs-1.9.7-windows.zip</a></td>
//   <td class="size">6.7 MB</td>
//   <td class="uploaded-by"><a href="/Vitallium">Vitallium</a></td>
//   <td class="count">122956</td>
//   <td class="date">
//     <div>
//       <time datetime="2014-01-27T18:29:53.706942" data-title="true">2014-01-27</time>
//     </div>
//   </td>
//   <td class="delete">
//
//   </td>
// </tr>

function* listPhantomjsDir(fullname) {
  var url = 'https://bitbucket.org/ariya/phantomjs/downloads';
  var result = yield* urllib.request(url, {
    timeout: 60000,
  });
  debug('listPhantomjsDir %s got %s, %j', url, result.status, result.headers);
  var html = result.data && result.data.toString() || '';
  var $ = cheerio.load(html);
  var items = [];
  $('tr.iterable-item').each(function (i, el) {
    var $el = $(this);
    var $link = $el.find('.name a');
    var name = $link.text();
    var downloadURL = $link.attr('href');
    if (!name || !downloadURL || !/\.(zip|bz2|gz)$/.test(downloadURL)) {
      return;
    }
    downloadURL = urlResolve(url, downloadURL);
    var size = parseInt(bytes($el.find('.size').text().toLowerCase().replace(/\s/g, '')));
    if (size > 1024 * 1024) {
      size -= 1024 * 1024;
    } else if (size > 1024) {
      size -= 1024;
    } else {
      size -= 10;
    }
    var date = $el.find('.date time').text();
    items.push({
      name: name, // 'SHASUMS.txt', 'x64/'
      date: date,
      size: size,
      type: 'file',
      parent: fullname,
      downloadURL: downloadURL,
    });
  });
  return items;
}
sync.listPhantomjsDir = listPhantomjsDir;

sync.listPhantomjsDiff = function* (fullname) {
  var items = yield* listPhantomjsDir(fullname);
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
    if (!exist || exist.date !== item.date) {
      news.push(item);
      continue;
    }

    // if (item.size !== exist.size) {
    //   news.push(item);
    //   continue;
    // }

    debug('skip %s', item.name);
  }
  return news;
};
