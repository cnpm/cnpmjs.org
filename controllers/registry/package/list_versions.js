'use strict';

const moment = require('moment');
const packageService = require('../../../services/package');

// GET /-/allversions?date={2020-02-20}
// List all packages versions sync at date(gmt_modified)

module.exports = function* () {
  const query = this.query;
  const date = moment(query.date, 'YYYY-MM-DD');
  if (!date.isValid()) {
    this.status = 400;
    const error = '[query_parse_error] Invalid value for `date`, should be `YYYY-MM-DD` format.';
    this.body = {
      error,
      reason: error,
    };
    return;
  }

  const today = date.format('YYYY-MM-DD');
  const rows = yield packageService.findAllModuleAbbreviateds({
    gmt_modified: {
      $gte: `${today} 00:00:00`,
      $lte: `${today} 23:59:59`,
    },
  });
  this.body = rows.map(row => {
    return {
      name: row.name,
      version: row.version,
      publish_time: new Date(row.publish_time),
      gmt_modified: row.gmt_modified,
    };
  });
};
