'use strict';

var utility = require('utility');
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

exports.getTotalByName = function* (name) {
  var rows = yield DownloadTotal.findAll({
    where: {
      name: name
    }
  });
  var count = 0;
  rows.forEach(function (row) {
    for (var i = 1; i <= 31; i++) {
      var day = i < 10 ? '0' + i : String(i);
      var field = 'd' + day;
      var val = row[field];
      if (typeof val === 'string') {
        val = utility.toSafeNumber(val);
      }
      count += val;
    }
  });
  return count;
};

exports.plusModuleTotal = function* (data) {
  var yearMonth = parseYearMonth(data.date);
  // all module download total
  var row = yield DownloadTotal.find({
    where: {
      name: '__all__',
      date: yearMonth
    }
  });
  if (!row) {
    row = DownloadTotal.build({
      name: '__all__',
      date: yearMonth,
    });
  }
  var field = 'd' + data.date.substring(8, 10);
  if (typeof row[field] === 'string') {
    // pg bigint is string...
    row[field] = utility.toSafeNumber(row[field]);
  }
  row[field] += data.count;
  if (row.changed()) {
    yield row.save();
  }

  row = yield DownloadTotal.find({
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
  if (typeof row[field] === 'string') {
    // pg bigint is string...
    row[field] = utility.toSafeNumber(row[field]);
  }
  row[field] += data.count;
  if (row.changed()) {
    return yield row.save();
  }
  return row;
};

exports.getTotal = function* (start, end) {
  return yield exports.getModuleTotal('__all__', start, end);
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
    for (var i = 1; i <= 31; i++) {
      var day = i < 10 ? '0' + i : String(i);
      var field = 'd' + day;
      var d = yearMonth + '-' + day;
      var count = row[field];
      if (typeof count === 'string') {
        count = utility.toSafeNumber(count);
      }
      if (count > 0 && d >= startDate && d <= endDate) {
        dates.push({
          name: row.name,
          count: count,
          date: d
        });
      }
    }
  });
  return dates;
}
