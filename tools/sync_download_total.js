var co = require('co');
var moment = require('moment');
var models = require('../models');
var DownloadTotal = require('../services/download_total');

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
      if (currentDate === date) {
        tasks.push(DownloadTotal.plusModuleTotal({
          date: date,
          name: row.name,
          count: row.count,
        }));
        if (tasks.length >= 100) {
          yield tasks;
          tasks = [];
        }
      } else {
        // date change, flush tasks
        yield tasks;
        currentDate = null;
      }
    }
    if (tasks.length > 0) {
      yield tasks;
    }
  }
})(function (err) {
  if (err) {
    console.error(err);
    throw err;
  }
  console.log('sync done, you can upgrade to 2.x now.');
  process.exit(0);
});
