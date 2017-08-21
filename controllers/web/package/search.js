'use strict';

var debug = require('debug')('cnpmjs.org:controllers:web:package:search');
var packageService = require('../../../services/package');

module.exports = function* search() {
  var params = this.params;
  var word = params.word || params[0];
  var limit = Number(this.query.limit) || 100;

  if (limit > 10000) {
    limit = 10000;
  }

  debug('search %j', word);
  var result = yield packageService.search(word, {
    limit: limit
  });

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
    this.jsonp = {
      keyword: word,
      match: match,
      packages: result.searchMatchs,
      keywords: result.keywordMatchs,
    };
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
