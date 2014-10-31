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

var models = require('../models');
var DownloadTotal = models.DownloadTotal;

exports.getModuleTotal = function* (name, start, end) {
  return yield DownloadTotal.findAll({
    where: {
      date: {
        gte: start,
        lte: end
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
  return yield row.save();
};


exports.getTotal = function* (start, end) {
  var sql = 'SELECT date, sum(count) AS count FROM download_total \
    WHERE date>=? AND date<=? GROUP BY date;';
  return yield models.query(sql, [start, end]);
};
