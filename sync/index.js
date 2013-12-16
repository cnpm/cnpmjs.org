/*!
 * cnpmjs.org - sync/index.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 */

'use strict';

/**
 * Module dependencies.
 */

var config = require('../config');
var ms = require('ms');
var mail = require('../common/mail');
var util = require('util');
var utility = require('utility');
var debug = require('debug')('cnpmjs.org:sync:index');
var Total = require('../proxy/total');

var sync;

switch (config.syncModel) {
case 'all':
  sync = require('./sync_all');
  break;
case 'exist':
  sync = require('./sync_exist');
  break;
}

//set sync_status = 0 at first
Total.updateSyncStatus(0, utility.noop);

// the same time only sync once
var syncing = false;

function handleSync() {
  debug('mode: %s, syncing: %s', config.syncModel, syncing);
  // check sync every one 30 minutes
  if (!syncing) {
    syncing = true;
    debug('start syncing');
    sync(function (err, data) {
      if (config.debug) {
        console.log(err, data);
      } else {
        sendMailToAdmin(err, data, new Date());
      }
      syncing = false;
    });
  }
}

if (sync) {
  handleSync();
  setInterval(handleSync, ms('30m'));
}

function sendMailToAdmin(err, result, syncTime) {
  result = result || {};
  var to = [];
  for (var name in config.admins) {
    to.push(config.admins[name]);
  }
  debug('Send email to all admins: %j, with err message: %s, result: %j, start sync time: %s.',
    to, err ? err.message : '', result, syncTime);
  var subject;
  var type;
  var html;
  if (err) {
    subject = 'Sync Error';
    type = 'error';
    html = util.format('Sync packages from official registry failed.\n' +
      'Start sync time is %s.\nError message is %s.', syncTime, err.message);
  } else if (result.fails && result.fails.length) {
    subject = 'Sync Finished But Some Packages Failed';
    type = 'warn';
    html = util.format('Sync packages from official registry finished, but some packages sync failed.\n' +
      'Start sync time is %s.\n %d packges sync failed: %j ...\n %d packages sync successes :%j ...',
      syncTime, result.fails.length, result.fails.slice(0, 10),
      result.successes.length, result.successes.slice(0, 10));
  } else {
    subject = 'Sync Finished';
    type = 'log';
    html = util.format('Sync packages from official registry finished.\n' +
      'Start sync time is %s.\n %d packages sync successes :%j ...',
      syncTime, result.successes.length, result.successes.slice(0, 10));
  }
  debug('send email with type: %s, subject: %s, html: %s', type, subject, html);
  mail[type](to, subject, html, utility.noop);
}
