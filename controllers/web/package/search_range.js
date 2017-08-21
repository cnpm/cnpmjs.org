'use strict';

var packageService = require('../../../services/package');

module.exports = function* searchRange() {
  var startKey = this.query.startkey || '';
  if (startKey[0] === '"') {
    startKey = startKey.substring(1);
  }
  if (startKey[startKey.length - 1] === '"') {
    startKey = startKey.substring(0, startKey.length - 1);
  }
  var limit = Number(this.query.limit) || 20;
  var result = yield packageService.search(startKey, {limit: limit});

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
