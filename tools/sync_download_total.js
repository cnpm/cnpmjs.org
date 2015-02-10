var co = require('co');
var moment = require('moment');
var models = require('../models');
var DownloadTotal = models.DownloadTotal;

function parseYearMonth(date) {
  return Number(date.substring(0, 7).replace('-', ''));
}

function* plusModuleTotal(data) {
  var yearMonth = parseYearMonth(data.date);
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
  row[field] += data.count;
  if (row.isDirty) {
    return yield row.save();
  }
  return row;
}

co(function* () {
  var result = yield models.query('select count(*) as count from downloads;');
  if (result[0].count > 0) {
    console.log('downloads has %d rows, no need to sync', result[0].count);
    return;
  }
  var lastId = 0;
  var count = 0;
  while (true) {
    var rows = yield models.query('select id, name, date, count from download_total where id > ? limit 10000;', [lastId]);
    count += rows.length;
    console.log('[%s] last id: %s, got %d rows, total %d', Date(), lastId, rows.length, count);
    if (rows.length === 0) {
      break;
    }
    console.log('%j', rows[0]);
    var tasks = [];
    var currentDate = null;
    var allCount = 0;
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      lastId = row.id;
      var date = row.date;
      if (typeof date !== 'string') {
        date = moment(date).format('YYYY-MM-DD');
      }
      if (!currentDate) {
        currentDate = date;
      }
      if (currentDate !== date) {
        console.log('saving %s %d rows, total count %d', currentDate, tasks.length, allCount);
        // date change, flush tasks
        tasks.push(plusModuleTotal({
          date: currentDate,
          name: '__all__',
          count: allCount
        }));
        allCount = 0;
        yield tasks;
        tasks = [];
        currentDate = null;
      }

      tasks.push(plusModuleTotal({
        date: date,
        name: row.name,
        count: row.count,
      }));
      allCount += row.count;

      if (tasks.length >= 100) {
        console.log('saving %s %d rows, total count %d', currentDate, tasks.length, allCount);
        tasks.push(plusModuleTotal({
          date: currentDate,
          name: '__all__',
          count: allCount
        }));
        allCount = 0;
        yield tasks;
        tasks = [];
        currentDate = null;
      }
    }

    if (allCount > 0) {
      tasks.push({
        date: currentDate,
        name: '__all__',
        count: allCount
      });
    }
    if (tasks.length > 0) {
      console.log('saving %s %d rows, total count %d', currentDate, tasks.length, allCount);
      yield tasks;
    }
  }
}).then(function () {
  console.log('sync done, you can upgrade to 2.x now.');
  process.exit(0);
}).catch(function (err) {
  console.error(err);
  throw err;
});
