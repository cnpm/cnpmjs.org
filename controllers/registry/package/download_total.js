'use strict';

const DownloadTotal = require('../../../services/download_total');
const DATE_REG = /^\d{4}-\d{2}-\d{2}$/;

module.exports = function* downloadTotal() {
  let range = this.params.range || this.params[0] || '';
  const name = this.params.name || this.params[1];

  range = range.split(':');
  if (range.length !== 2
      || !range[0].match(DATE_REG)
      || !range[1].match(DATE_REG)) {
    this.status = 400;
    this.body = {
      error: 'range_error',
      reason: 'range must be YYYY-MM-DD:YYYY-MM-DD style',
    };
    return;
  }

  this.body = name
    ? yield getPackageTotal(name, range[0], range[1])
    : yield getTotal(range[0], range[1]);
};

function* getPackageTotal(name, start, end) {
  const res = yield DownloadTotal.getModuleTotal(name, start, end);
  const downloads = res.map(function(row) {
    return {
      day: row.date,
      downloads: row.count,
    };
  });

  downloads.sort(function(a, b) {
    return a.day > b.day ? 1 : -1;
  });

  return {
    downloads,
    package: name,
    start,
    end,
  };
}

function* getTotal(start, end) {
  const res = yield DownloadTotal.getTotal(start, end);
  const downloads = res.map(function(row) {
    return {
      day: row.date,
      downloads: row.count,
    };
  });

  downloads.sort(function(a, b) {
    return a.day > b.day ? 1 : -1;
  });

  return {
    downloads,
    start,
    end,
  };
}
