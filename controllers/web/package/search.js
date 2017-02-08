/**!
 * cnpmjs.org - controllers/web/package/search.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 *  fengmk2 <m@fengmk2.com> (http://fengmk2.com)
 */

'use strict';

/**
 * Module dependencies.
 */

const debug = require('debug')('cnpmjs.org:controllers:web:package:search');
const packageService = require('../../../services/package');

module.exports = function* search() {
  const params = this.params;
  const word = params.word || params[0];
  let limit = Number(this.query.limit) || 100;

  if (limit > 10000) {
    limit = 10000;
  }

  debug('search %j', word);
  const result = yield packageService.search(word, {
    limit,
  });

  let match = null;
  for (let i = 0; i < result.searchMatchs.length; i++) {
    const p = result.searchMatchs[i];
    if (p.name === word) {
      match = p;
      break;
    }
  }

  // return a json result
  if (this.query && this.query.type === 'json') {
    this.jsonp = {
      keyword: word,
      match,
      packages: result.searchMatchs,
      keywords: result.keywordMatchs,
    };
    return;
  }
  yield this.render('search', {
    title: 'Keyword - ' + word,
    keyword: word,
    match,
    packages: result.searchMatchs,
    keywords: result.keywordMatchs,
  });
};
