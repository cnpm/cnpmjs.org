/**!
 * cnpmjs.org - services/download_total.js
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

var moment = require('moment');
var models = require('../models');
var DownloadTotal = models.DownloadTotal;

exports.getModuleTotal = function* (name, start, end) {
  var dates = getDateRanges(start, end);
  return yield DownloadTotal.findAll({
    where: {
      date: {
        in: dates
      },
      name: name
    }
  });
};

exports.plusModuleTotal = function* (data) {
  var row = yield DownloadTotal.find({
    where: {
      date: data.date,
      name: data.name
    }
  });
  if (!row) {
    row = DownloadTotal.build({
      date: data.date,
      name: data.name
    });
  }
  row.count += data.count;
  if (row.isDirty) {
    return yield row.save();
  }
  return row;
};


exports.getTotal = function* (start, end) {
  var sql = 'SELECT date, sum(count) AS count FROM download_total \
    WHERE date in (?) GROUP BY date';
  return yield models.query(sql, [getDateRanges(start, end)]);
};

function getDateRanges(start, end) {
  var startDate = moment(start, 'YYYY-MM-DD');
  var ranges = [start];
  if (start < end) {
    var next;
    while (true) {
      next = startDate.add(1, 'days').format('YYYY-MM-DD');
      if (next >= end) {
        break;
      }
      ranges.push(next);
    }
    ranges.push(end);
  }
  return ranges;
}
