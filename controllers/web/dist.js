/**!
 * cnpmjs.org - controllers/web/dist.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

"use strict";

/**
 * Module dependencies.
 */

var debug = require('debug')('cnpmjs.org:controllers:web:dist');
var mime = require('mime');
var urlparse = require('url').parse;
var Dist = require('../../services/dist');
var config = require('../../config');
var downloadAsReadStream = require('../utils').downloadAsReadStream;

function padding(max, current, pad) {
  pad = pad || ' ';
  var left = max - current;
  var str = '';
  for (var i = 0; i < left; i++) {
    str += pad;
  }
  return str;
}

exports.list = function* (next) {
  var params = this.params;
  var url = params[0];
  if (!url) {
    // GET /dist => /dist/
    return this.redirect('/dist/');
  }

  var isDir = url[url.length - 1] === '/';
  if (!isDir) {
    return yield* download.call(this, next);
  }

  var items = yield* Dist.listdir(url);
  if (url === '/') {
    // phantomjs/
    items.push({
      name: 'phantomjs/',
      date: '',
    });
  }

  yield this.render('dist', {
    title: 'Mirror index of ' + config.disturl + url,
    disturl: config.disturl,
    dirname: url,
    items: items,
    padding: padding
  });
};

function* download(next) {
  var fullname = this.params[0];
  var info = yield* Dist.getfile(fullname);
  debug('download %s got %j', fullname, info);
  if (!info || !info.url) {
    return yield* next;
  }

  if (/\.(html|js|css|json|txt)$/.test(fullname)) {
    if (info.url.indexOf('http') === 0) {
      info.url = urlparse(info.url).path;
    }
    return yield* pipe.call(this, info, false);
  }

  if (info.url.indexOf('http') === 0) {
    return this.redirect(info.url);
  }
  yield* pipe.call(this, info, true);
}

function* pipe(info, attachment) {
  debug('pipe %j, attachment: %s', info, attachment);
  // download it from nfs
  if (typeof info.size === 'number' && info.size > 0) {
    this.length = info.size;
  }
  this.type = mime.lookup(info.url);
  if (attachment) {
    this.attachment(info.name);
  }
  if (info.sha1) {
    this.etag = info.sha1;
  }
  this.body = yield* downloadAsReadStream(info.url);
}
