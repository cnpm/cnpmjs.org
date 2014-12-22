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
var DownloadTotal = require('../models').DownloadTotal;

exports.getModuleTotal = function* (name, start, end) {
  var startMonth = parseYearMonth(start);
  var endMonth = parseYearMonth(end);
  var rows = yield DownloadTotal.findAll({
    where: {
      date: {
        gte: startMonth,
        lte: endMonth
      },
      name: name
    }
  });
  return formatRows(rows, start, end);
};

exports.plusModuleTotal = function* (data) {
  var yearMonth = parseYearMonth(data.date);
  var row = yield DownloadTotal.find({
    where: {
      name: data.name,
      date: yearMonth,
    }
  });
  if (!row) {
    row = DownloadTotal.build({
      name: data.name,
      date: yearMonth,
    });
  }
  var field = 'd' + data.date.substring(8, 10);
  row[field] += data.count;
  if (row.isDirty) {
    return yield row.save();
  }
  return row;
};

exports.getTotal = function* (start, end) {
  var startMonth = parseYearMonth(start);
  var endMonth = parseYearMonth(end);
  var rows = yield DownloadTotal.findAll({
    where: {
      date: {
        gte: startMonth,
        lte: endMonth
      },
    }
  });
  var map = {};
  var downloads = [];
  rows.forEach(function (row) {
    var date = String(row.date);
    var month = date.substring(4, 6);
    var year = date.substring(0, 4);
    var yearMonth = year + '-' + month;
    var days = MONTHS[month];
    if (month === '02' && moment([Number(year)]).isLeapYear()) {
      days += 1;
    }
    for (var i = 1; i <= days; i++) {
      var day = i < 10 ? '0' + i : String(i);
      var field = 'd' + day;
      var d = yearMonth + '-' + day;
      var count = row[field];
      if (d >= start && d <= end && count > 0) {
        var item = map[d];
        if (!item) {
          map[d] = item = {
            count: 0,
            date: d
          };
          downloads.push(item);
        }
        item.count += row[field];
      }
    }
  });
  return downloads;
};

var MONTHS = {
  '01': 31,
  '02': 28, // leap year: 29
  '03': 31,
  '04': 30,
  '05': 31,
  '06': 30,
  '07': 31,
  '08': 31,
  '09': 30,
  '10': 31,
  '11': 30,
  '12': 31
};

function parseYearMonth(date) {
  return Number(date.substring(0, 7).replace('-', ''));
}

function formatRows(rows, startDate, endDate) {
  var dates = [];
  rows.forEach(function (row) {
    var date = String(row.date);
    var month = date.substring(4, 6);
    var year = date.substring(0, 4);
    var yearMonth = year + '-' + month;
    var days = MONTHS[month];
    if (month === '02' && moment([Number(year)]).isLeapYear()) {
      days += 1;
    }
    for (var i = 1; i <= days; i++) {
      var day = i < 10 ? '0' + i : String(i);
      var field = 'd' + day;
      var d = yearMonth + '-' + day;
      if (d >= startDate && d <= endDate) {
        dates.push({
          name: row.name,
          count: row[field],
          date: d
        });
      }
    }
  });
  return dates;
}
