/**!
 * cnpmjs.org - controllers/utils.js
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

const debug = require('debug')('cnpmjs.org:controllers:utils');
const path = require('path');
const fs = require('fs');
const utility = require('utility');
const ms = require('humanize-ms');
const moment = require('moment');
const downloadTotalService = require('../services/download_total');
const nfs = require('../common/nfs');
const config = require('../config');

const DOWNLOAD_TIMEOUT = ms('10m');

exports.downloadAsReadStream = function* (key) {
  const options = { timeout: DOWNLOAD_TIMEOUT };
  if (nfs.createDownloadStream) {
    return yield nfs.createDownloadStream(key, options);
  }

  const tmpPath = path.join(config.uploadDir,
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
  const tarball = fs.createReadStream(tmpPath);
  tarball.once('error', cleanup);
  tarball.once('end', cleanup);
  return tarball;
};

exports.getDownloadTotal = function* (name) {
  let end = moment();
  let start = end.clone().subtract(1, 'months').startOf('month');
  const lastday = end.clone().subtract(1, 'days').format('YYYY-MM-DD');
  let lastweekStart = end.clone().subtract(1, 'weeks').startOf('isoweek');
  const lastweekEnd = lastweekStart.clone().endOf('isoweek').format('YYYY-MM-DD');
  const lastmonthEnd = start.clone().endOf('month').format('YYYY-MM-DD');
  const thismonthStart = end.clone().startOf('month').format('YYYY-MM-DD');
  const thisweekStart = end.clone().startOf('isoweek').format('YYYY-MM-DD');
  start = start.format('YYYY-MM-DD');
  end = end.format('YYYY-MM-DD');
  lastweekStart = lastweekStart.format('YYYY-MM-DD');
  const method = name ? 'getModuleTotal' : 'getTotal';
  const args = [ start, end ];
  if (name) {
    args.unshift(name);
  }

  const rows = yield downloadTotalService[method].apply(downloadTotalService, args);
  const download = {
    today: 0,
    thisweek: 0,
    thismonth: 0,
    lastday: 0,
    lastweek: 0,
    lastmonth: 0,
  };

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
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

exports.setLicense = function(pkg) {
  let license;
  license = pkg.license || pkg.licenses || pkg.licence || pkg.licences;
  if (!license) {
    return;
  }

  if (Array.isArray(license)) {
    license = license[0];
  }

  if (typeof license === 'object') {
    pkg.license = {
      name: license.name || license.type,
      url: license.url,
    };
  }

  if (typeof license === 'string') {
    if (license.match(/(http|https)(:\/\/)/ig)) {
      pkg.license = {
        name: license,
        url: license,
      };
    } else {
      pkg.license = {
        url: exports.getOssLicenseUrlFromName(license),
        name: license,
      };
    }
  }
};

exports.getOssLicenseUrlFromName = function(name) {
  const base = 'http://opensource.org/licenses/';

  const licenseMap = {
    bsd: 'BSD-2-Clause',
    mit: 'MIT',
    x11: 'MIT',
    'mit/x11': 'MIT',
    'apache 2.0': 'Apache-2.0',
    apache2: 'Apache-2.0',
    'apache 2': 'Apache-2.0',
    'apache-2': 'Apache-2.0',
    apache: 'Apache-2.0',
    gpl: 'GPL-3.0',
    gplv3: 'GPL-3.0',
    gplv2: 'GPL-2.0',
    gpl3: 'GPL-3.0',
    gpl2: 'GPL-2.0',
    lgpl: 'LGPL-2.1',
    'lgplv2.1': 'LGPL-2.1',
    lgplv2: 'LGPL-2.1',
  };

  return licenseMap[name.toLowerCase()] ?
    base + licenseMap[name.toLowerCase()] : base + name;
};
