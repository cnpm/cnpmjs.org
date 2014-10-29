/*!
 * cnpmjs.org - controllers/web/package.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 */

'use strict';

/**
 * Module dependencies.
 */

var debug = require('debug')('cnpmjs.org:controllers:web:package');


exports.search = function *(next) {
  var params = this.params;
  var word = params.word || params[0];
  debug('search %j', word);
  var result = yield Module.search(word);

  var match = null;
  for (var i = 0; i < result.searchMatchs.length; i++) {
    var p = result.searchMatchs[i];
    if (p.name === word) {
      match = p;
      break;
    }
  }

  // return a json result
  if (this.query && this.query.type === 'json') {
    this.body = {
      keyword: word,
      match: match,
      packages: result.searchMatchs,
      keywords: result.keywordMatchs,
    };
    this.type = 'application/json; charset=utf-8';
    return;
  }
  yield this.render('search', {
    title: 'Keyword - ' + word,
    keyword: word,
    match: match,
    packages: result.searchMatchs,
    keywords: result.keywordMatchs,
  });
};

exports.rangeSearch = function *(next) {
  var startKey = this.query.startkey || '';
  if (startKey[0] === '"') {
    startKey = startKey.substring(1);
  }
  if (startKey[startKey.length - 1] === '"') {
    startKey = startKey.substring(0, startKey.length - 1);
  }
  var limit = Number(this.query.limit) || 20;
  var result = yield Module.search(startKey, {limit: limit});

  var packages = result.searchMatchs.concat(result.keywordMatchs);

  var rows = [];
  for (var i = 0; i < packages.length; i++) {
    var p = packages[i];
    var row = {
      key: p.name,
      count: 1,
      value: {
        name: p.name,
        description: p.description,
      }
    };
    rows.push(row);
  }
  this.body = {
    rows: rows
  };
};

exports.displaySync = function* (next) {
  var name = this.params.name || this.params[0] || this.query.name;
  yield this.render('sync', {
    name: name,
    title: 'Sync - ' + name,
  });
};

exports.listPrivates = function* () {
  var packages = yield Module.listPrivates();
  yield this.render('private', {
      title: 'private packages',
      packages: packages
    });
};
