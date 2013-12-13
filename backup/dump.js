/**!
 * cnpmjs.org - backup/dump.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

/**
 * 1. dump module
 * 2. dump tag
 * 3. dump user
 * 4. total
 * 5. download_total
 */

var path = require('path');
var fs = require('fs');
var moment = require('moment');
var eventproxy = require('eventproxy');
var util = require('util');
var zlib = require('zlib');
var mysql = require('../common/mysql');
var nfs = require('../common/nfs');
var config = require('../config');

function dumpTable(name, lastRow, callback) {
  var sql = 'SELECT * from ' + name + ' WHERE gmt_modified >=? ORDER BY gmt_modified ASC LIMIT 10000;';
  mysql.query(sql, [lastRow.gmt_modified], function (err, rows) {
    if (err || rows.length === 0) {
      return callback(err, rows);
    }
    if (rows[0].id === lastRow.id) {
      rows = rows.slice(1);
    }
    callback(null, rows);
  });
}

function log() {
  var str = '[' + moment().format('YYYY-MM-DD HH:mm:ss') + '] ' + util.format.apply(util, arguments);
  console.log(str);
}

function syncTable(name, callback) {
  var datadir = __dirname;
  var dataFile = path.join(datadir, moment().format('YYYY-MM-DD-HH') + '_' + name + '.json');
  var lastRowFile = path.join(datadir, name + '_lastdate.json');
  var lastRow = null;
  if (fs.existsSync(lastRowFile)) {
    lastRow = require(lastRowFile);
    lastRow.gmt_modified = new Date(Date.parse(lastRow.gmt_modified));
  } else {
    lastRow = {
      gmt_modified: new Date('2011-11-11'),
    };
  }

  log('getting "%s" since %j', name, lastRow);
  dumpTable(name, lastRow, function (err, rows) {
    console.log('[%s] got %d rows', Date(), rows && rows.length || 0);
    if (err) {
      return callback(err);
    }

    if (!rows || rows.length === 0) {
      return callback();
    }

    var writeStream = fs.createWriteStream(dataFile, {flags: 'a'});
    writeStream.once('error', callback);
    for (var i = 0; i < rows.length; i++) {
      writeStream.write(JSON.stringify(rows[i]) + '\n');
    }
    writeStream.end();
    writeStream.on('finish', function () {
      log('append %d rows to %s', rows.length, dataFile);
      var gzfile = dataFile + '.gz';
      var gzip = zlib.createGzip();
      var inp = fs.createReadStream(dataFile);
      var out = fs.createWriteStream(gzfile);
      inp.pipe(gzip).pipe(out);
      out.once('error', callback);
      out.on('finish', function () {
        var key = path.join(config.backupFilePrefix, path.basename(gzfile));
        log('saving %s to %s ...', gzfile, key);
        nfs.upload(gzfile, {key: key}, function (err, result) {
          if (err) {
            return callback(err);
          }

          lastRow = rows[rows.length - 1];
          lastRow = {gmt_modified: lastRow.gmt_modified, id: lastRow.id};
          fs.writeFileSync(lastRowFile, JSON.stringify(lastRow));
          log('save %s data file to %j, lastrow: %j', name, result, lastRow);
          callback();
        });
      });
    });
  });
}

var ep = eventproxy.create();
ep.fail(function (err) {
  log('error: %s', err.stack);
  process.exit(1);
});

syncTable('module', ep.done('module'));

ep.on('module', function () {
  syncTable('tag', ep.done('tag'));
});

ep.on('tag', function () {
  syncTable('user', ep.done('user'));
});

ep.on('user', function () {
  syncTable('total', ep.done('total'));
});

ep.on('total', function () {
  syncTable('download_total', ep.done('download_total'));
});

ep.on('download_total', function () {
  ep.emit('finish');
});

ep.on('finish', function () {
  log('finish, %d process exit', process.pid);
  process.exit(0);
});
