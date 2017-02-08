/**!
 * cnpmjs.org - controllers/web/package/search_range.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

const packageService = require('../../../services/package');

module.exports = function* searchRange() {
  let startKey = this.query.startkey || '';
  if (startKey[0] === '"') {
    startKey = startKey.substring(1);
  }
  if (startKey[startKey.length - 1] === '"') {
    startKey = startKey.substring(0, startKey.length - 1);
  }
  const limit = Number(this.query.limit) || 20;
  const result = yield packageService.search(startKey, { limit });

  const packages = result.searchMatchs.concat(result.keywordMatchs);

  const rows = [];
  for (let i = 0; i < packages.length; i++) {
    const p = packages[i];
    const row = {
      key: p.name,
      count: 1,
      value: {
        name: p.name,
        description: p.description,
      },
    };
    rows.push(row);
  }
  this.body = {
    rows,
  };
};
