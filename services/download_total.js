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
  start += ' 00:00:00';
  end += ' 23:59:59';
  var rows = yield DownloadTotal.findAll({
    where: {
      date: {
        gte: start,
        lte: end
      },
      name: name
    }
  });
  return formatRows(rows);
};

exports.plusModuleTotal = function* (data) {
  data.date = new Date(data.date);
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
  start += ' 00:00:00';
  end += ' 23:59:59';
  var sql = 'SELECT date, sum(count) AS count FROM download_total \
    WHERE date >= ? AND date <= ? GROUP BY date;';
  var rows = yield models.query(sql, [start, end]);
  return formatRows(rows);
};

function formatRows(rows) {
  return rows.map(function (row) {
    var date = row.date;
    if (typeof date === 'string') {
      // sqlite raw datetime is string format ...
      date = date.substring(0, 10);
    } else {
      // mysql return DateTime
      date = moment(row.date).format('YYYY-MM-DD');
    }
    return {
      name: row.name,
      count: row.count,
      date: date,
    };
  });
}
