'use strict';

const Total = require('../services/total');
const version = require('../package.json').version;
const config = require('../config');
const getDownloadTotal = require('./utils').getDownloadTotal;

const startTime = '' + Date.now();
let cache = null;

module.exports = function* showTotal() {
  if (cache && Date.now() - cache.cache_time < 10000) {
    // cache 10 seconds
    this.body = cache;
    return;
  }

  const r = yield [Total.get(), getDownloadTotal()];
  const total = r[0];
  const download = r[1];

  total.download = download;
  total.db_name = 'registry';
  total.instance_start_time = startTime;
  total.node_version = process.version;
  total.app_version = version;
  total.donate = 'https://www.gittip.com/fengmk2';
  total.sync_model = config.syncModel;

  cache = total;
  total.cache_time = Date.now();

  this.body = total;
};
