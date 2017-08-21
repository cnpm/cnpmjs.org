'use strict';

var debug = require('debug')('cnpmjs.org:controllers:utils');
var path = require('path');
var fs = require('fs');
var utility = require('utility');
var ms = require('humanize-ms');
var moment = require('moment');
var downloadTotalService = require('../services/download_total');
var nfs = require('../common/nfs');
var config = require('../config');

var DOWNLOAD_TIMEOUT = ms('10m');

exports.downloadAsReadStream = function* (key) {
  var options = { timeout: DOWNLOAD_TIMEOUT };
  if (nfs.createDownloadStream) {
    return yield nfs.createDownloadStream(key, options);
  }

  var tmpPath = path.join(config.uploadDir,
    utility.randomString() + key.replace(/\//g, '-'));
  function cleanup() {
    debug('cleanup %s', tmpPath);
    fs.unlink(tmpPath, utility.noop);
  }
  debug('downloadAsReadStream() %s to %s', key, tmpPath);
  try {
    yield nfs.download(key, tmpPath, options);
  } catch (err) {
    debug('downloadAsReadStream() %s to %s error: %s', key, tmpPath, err.stack);
    cleanup();
    throw err;
  }
  var tarball = fs.createReadStream(tmpPath);
  tarball.once('error', cleanup);
  tarball.once('end', cleanup);
  return tarball;
};

exports.getDownloadTotal = function* (name) {
  var end = moment();
  var start = end.clone().subtract(1, 'months').startOf('month');
  var lastday = end.clone().subtract(1, 'days').format('YYYY-MM-DD');
  var lastweekStart = end.clone().subtract(1, 'weeks').startOf('isoweek');
  var lastweekEnd = lastweekStart.clone().endOf('isoweek').format('YYYY-MM-DD');
  var lastmonthEnd = start.clone().endOf('month').format('YYYY-MM-DD');
  var thismonthStart = end.clone().startOf('month').format('YYYY-MM-DD');
  var thisweekStart = end.clone().startOf('isoweek').format('YYYY-MM-DD');
  start = start.format('YYYY-MM-DD');
  end = end.format('YYYY-MM-DD');
  lastweekStart = lastweekStart.format('YYYY-MM-DD');
  var method = name ? 'getModuleTotal' : 'getTotal';
  var args = [start, end];
  if (name) {
    args.unshift(name);
  }

  var rows = yield downloadTotalService[method].apply(downloadTotalService, args);
  var download = {
    today: 0,
    thisweek: 0,
    thismonth: 0,
    lastday: 0,
    lastweek: 0,
    lastmonth: 0,
  };

  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (r.date === end) {
      download.today += r.count;
    }
    if (r.date >= thismonthStart) {
      download.thismonth += r.count;
    }
    if (r.date >= thisweekStart) {
      download.thisweek += r.count;
    }

    if (r.date === lastday) {
      download.lastday += r.count;
    }
    if (r.date >= lastweekStart && r.date <= lastweekEnd) {
      download.lastweek += r.count;
    }
    if (r.date >= start && r.date <= lastmonthEnd) {
      download.lastmonth += r.count;
    }
  }
  return download;
};

exports.setLicense = function (pkg) {
  var license;
  license = pkg.license || pkg.licenses || pkg.licence || pkg.licences;
  if (!license) {
    return ;
  }

  if (Array.isArray(license)) {
    license = license[0];
  }

  if (typeof license === 'object') {
    pkg.license = {
      name: license.name || license.type,
      url: license.url
    };
  }

  if (typeof license === 'string') {
    if (license.match(/(http|https)(:\/\/)/ig)) {
      pkg.license = {
        name: license,
        url: license
      };
    } else {
      pkg.license = {
        url: exports.getOssLicenseUrlFromName(license),
        name: license
      };
    }
  }
};

exports.getOssLicenseUrlFromName = function (name) {
  var base = 'http://opensource.org/licenses/';

  var licenseMap = {
    'bsd': 'BSD-2-Clause',
    'mit': 'MIT',
    'x11': 'MIT',
    'mit/x11': 'MIT',
    'apache 2.0': 'Apache-2.0',
    'apache2': 'Apache-2.0',
    'apache 2': 'Apache-2.0',
    'apache-2': 'Apache-2.0',
    'apache': 'Apache-2.0',
    'gpl': 'GPL-3.0',
    'gplv3': 'GPL-3.0',
    'gplv2': 'GPL-2.0',
    'gpl3': 'GPL-3.0',
    'gpl2': 'GPL-2.0',
    'lgpl': 'LGPL-2.1',
    'lgplv2.1': 'LGPL-2.1',
    'lgplv2': 'LGPL-2.1'
  };

  return licenseMap[name.toLowerCase()] ?
    base + licenseMap[name.toLowerCase()] : base + name;
};
