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
var bytes = require('bytes');
var crypto = require('crypto');
var utility = require('utility');
var thunkify = require('thunkify-wrap');
var cheerio = require('cheerio');
var urlResolve = require('url').resolve;
var common = require('../lib/common');
var distService = require('../services/dist');
var config = require('../config');
var nfs = require('../common/nfs');
var logger = require('../common/logger');
var urllib = require('../common/urllib');

var USER_AGENT = 'distsync.cnpmjs.org/' + config.version + ' ' + urllib.USER_AGENT;

module.exports = DistSyncer;

function DistSyncer(options) {
  var disturl = options.disturl;
  if (disturl[disturl.length - 1] === '/') {
    disturl = disturl.replace(/(\/+)$/, '');
  }
  this._disturl = disturl;
}

var proto = DistSyncer.prototype;

proto.start = function* (name) {
  name = name || '/';
  if (name[name.length - 1] !== '/') {
    name += '/';
  }
  yield* this.syncDir(name);
};

proto.syncDir = function* (fullname, info) {
  var news = yield* this.listdiff(fullname);
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

  logger.syncInfo('sync %s:%s got %d new items, %d dirs, %d files to sync',
    this._disturl, fullname, news.length, dirs.length, files.length);

  for (var i = 0; i < files.length; i++) {
    yield* this.syncFile(files[i]);
  }

  for (var i = 0; i < dirs.length; i++) {
    var dir = dirs[i];
    yield* this.syncDir(dir.parent + dir.name, dir);
  }

  if (info) {
    logger.syncInfo('Save dir:%s %j to database', fullname, info);
    yield* distService.savedir(info);
  }

  logger.syncInfo('Sync %s finished, %d dirs, %d files',
    fullname, dirs.length, files.length);
};

proto.syncFile = function* (info) {
  var name = info.parent + info.name;
  name = process.pid + name.replace(/\//g, '_'); // make sure no parent dir
  var isPhantomjsURL = false;
  var downurl = this._disturl + info.parent + info.name;
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
    var r = yield urllib.requestThunk(downurl, options);
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
    } else if (info.size > 0 && dataSize !== info.size) {
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
  yield* distService.savefile(info);
};

// <a href="latest/">latest/</a>                                            02-May-2014 14:45                   -
// <a href="node-v0.4.10.tar.gz">node-v0.4.10.tar.gz</a>                                26-Aug-2011 16:22            12410018
var FILE_RE = /^<a[^>]+>([^<]+)<\/a>\s+(\d+\-\w+\-\d+ \d+\:\d+)\s+([\-\d]+)/;

// */docs/api/
var DOC_API_RE = /\/docs\/api\/$/;

// <li><a href="documentation.html">About these Docs</a></li>
// <li><a href="synopsis.html">Synopsis</a></li>
// <li><a href="assert.html">Assertion Testing</a></li>
// <li><a href="buffer.html">Buffer</a></li>
// <li><a href="addons.html">C/C++ Addons</a></li>
// <li><a href="child_process.html">Child Processes</a></li>
// <div id="gtoc">
//   <p>
//     <a href="index.html" name="toc">Index</a> |
//     <a href="all.html">View on single page</a> |
//     <a href="index.json">View as JSON</a>
//   </p>
// </div>
var DOC_API_FILE_ALL_RE = /<a[^"]+\"(\w+\.(?:html|json))\"[^>]*>[^<]+<\/a>/gm;
var DOC_API_FILE_RE = /<a[^"]+\"(\w+\.(?:html|json))\"[^>]*>[^<]+<\/a>/;

proto.listdir = function* (fullname) {
  var url = this._disturl + fullname;
  var isDocPath = false;
  if (DOC_API_RE.test(fullname)) {
    isDocPath = true;
    url += 'index.html';
  }
  var result = yield urllib.requestThunk(url, {
    timeout: 60000,
  });
  debug('listdir %s got %s, %j', url, result.status, result.headers);
  var html = result.data && result.data.toString() || '';
  var items = [];
  // "last-modified":"Tue, 11 Mar 2014 22:44:36 GMT"
  var date = result.headers['last-modified'] || result.headers.date || '';

  if (isDocPath) {
    // add assets/
    items.push({
      name: 'assets/',
      date: date,
      size: '-',
      type: 'dir',
      parent: fullname,
    });

    var needJSON = false;
    var htmlfileNames = [];
    var lines = html.match(DOC_API_FILE_ALL_RE) || [];
    for (var i = 0; i < lines.length; i++) {
      var m = DOC_API_FILE_RE.exec(lines[i].trim());
      if (!m) {
        continue;
      }
      var itemName = m[1];
      items.push({
        name: itemName,
        date: date,
        size: 0,
        type: 'file',
        parent: fullname,
      });
      if (itemName.indexOf('.json') > 0) {
        needJSON = true;
      }
      if (itemName.indexOf('.html') > 0 && itemName !== 'index.html') {
        htmlfileNames.push(itemName);
      }
    }
    debug('listdir %s got %j', fullname, htmlfileNames);
    if (needJSON) {
      // node >= 0.8.0
      htmlfileNames.forEach(function (itemName) {
        items.push({
          name: itemName.replace('.html', '.json'), // download *.json format
          date: date,
          size: 0,
          type: 'file',
          parent: fullname,
        });
      });
    }
  } else {
    var lines = html.split('\n');
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
  }

  // node <= v0.11.11, /docs/ is not list, has a index.html
  if (items.length === 0 && /\/docs\/$/.test(fullname)) {
    items.push({
      name: 'api/',
      date: date,
      size: '-',
      type: 'dir',
      parent: fullname,
    });

    // sh_main.js
    // sh_javascript.min.js
    items.push({
      name: 'sh_main.js',
      date: date,
      size: 0,
      type: 'file',
      parent: fullname,
    });

    items.push({
      name: 'sh_javascript.min.js',
      date: date,
      size: 0,
      type: 'file',
      parent: fullname,
    });
  }

  return items;
};

proto.listdiff = function* (fullname) {
  var items = yield* this.listdir(fullname);
  if (items.length === 0) {
    return items;
  }
  var exists = yield* distService.listdir(fullname);
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

proto.syncPhantomjsDir = function* () {
  var fullname = '/phantomjs/';
  var files = yield* this.listPhantomjsDiff(fullname);

  logger.syncInfo('sync remote:%s got %d files to sync',
    fullname, files.length);

  for (var i = 0; i < files.length; i++) {
    yield* this.syncFile(files[i]);
  }

  logger.syncInfo('SyncPhantomjsDir %s finished, %d files',
    fullname, files.length);
};

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

proto.listPhantomjsDir = function* (fullname) {
  var url = 'https://bitbucket.org/ariya/phantomjs/downloads';
  var result = yield urllib.request(url, {
    timeout: 60000,
  });
  debug('listPhantomjsDir %s got %s, %j', url, result.status, result.headers);
  var html = result.data && result.data.toString() || '';
  var $ = cheerio.load(html);
  var items = [];
  $('tr.iterable-item').each(function (_, el) {
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
};

proto.listPhantomjsDiff = function* (fullname) {
  var items = yield* this.listPhantomjsDir(fullname);
  if (items.length === 0) {
    return items;
  }
  var exists = yield* distService.listdir(fullname);
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
