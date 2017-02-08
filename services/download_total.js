'use strict';

const utility = require('utility');
const DownloadTotal = require('../models').DownloadTotal;

exports.getModuleTotal = function* (name, start, end) {
  const startMonth = parseYearMonth(start);
  const endMonth = parseYearMonth(end);
  const rows = yield DownloadTotal.findAll({
    where: {
      date: {
        gte: startMonth,
        lte: endMonth,
      },
      name,
    },
  });
  return formatRows(rows, start, end);
};

exports.getTotalByName = function* (name) {
  const rows = yield DownloadTotal.findAll({
    where: {
      name,
    },
  });
  let count = 0;
  rows.forEach(function(row) {
    for (let i = 1; i <= 31; i++) {
      const day = i < 10 ? '0' + i : String(i);
      const field = 'd' + day;
      let val = row[field];
      if (typeof val === 'string') {
        val = utility.toSafeNumber(val);
      }
      count += val;
    }
  });
  return count;
};

exports.plusModuleTotal = function* (data) {
  const yearMonth = parseYearMonth(data.date);
  // all module download total
  let row = yield DownloadTotal.find({
    where: {
      name: '__all__',
      date: yearMonth,
    },
  });
  if (!row) {
    row = DownloadTotal.build({
      name: '__all__',
      date: yearMonth,
    });
  }
  let field = 'd' + data.date.substring(8, 10);
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
    },
  });
  if (!row) {
    row = DownloadTotal.build({
      name: data.name,
      date: yearMonth,
    });
  }
  field = 'd' + data.date.substring(8, 10);
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
  const dates = [];
  rows.forEach(function(row) {
    const date = String(row.date);
    const month = date.substring(4, 6);
    const year = date.substring(0, 4);
    const yearMonth = year + '-' + month;
    for (let i = 1; i <= 31; i++) {
      const day = i < 10 ? '0' + i : String(i);
      const field = 'd' + day;
      const d = yearMonth + '-' + day;
      let count = row[field];
      if (typeof count === 'string') {
        count = utility.toSafeNumber(count);
      }
      if (count > 0 && d >= startDate && d <= endDate) {
        dates.push({
          name: row.name,
          count,
          date: d,
        });
      }
    }
  });
  return dates;
}
