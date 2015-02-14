/**!
 * cnpmjs.org - common/mail.js
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

var nodemailer = require('nodemailer');
var utility = require('utility');
var os = require('os');
var mailConfig = require('../config').mail;

var smtpConfig;
if (mailConfig.auth) {
  // new style
  smtpConfig = mailConfig;
} else {
  smtpConfig = {
    enable: mailConfig.enable,
    // backward compat
    host: mailConfig.host,
    port: mailConfig.port,
    secure: mailConfig.secure || mailConfig.ssl,
    debug: mailConfig.debug,
    auth: {
      user: mailConfig.user,
      pass: mailConfig.pass
    }
  };
}

var transport;

/**
 * Send notice email with mail level and appname.
 *
 * @param {String|Array} to, email or email list.
 * @param {String} level, e.g.: 'log, warn, error'.
 * @param {String} subject
 * @param {String} html
 * @param {Function(err, result)} callback
 */
exports.notice = function sendLogMail(to, level, subject, html, callback) {
  subject = '[' + mailConfig.appname + '] [' + level + '] [' + os.hostname() + '] ' + subject;
  html = String(html);
  exports.send(to, subject, html.replace(/\n/g, '<br/>'), callback);
};

var LEVELS = [ 'log', 'warn', 'error' ];
LEVELS.forEach(function (level) {
  exports[level] = function (to, subject, html, callback) {
    exports.notice(to, level, subject, html, callback);
  };
});

/**
 * Send email.
 * @param {String|Array} to, email or email list.
 * @param {String} subject
 * @param {String} html
 * @param {Function(err, result)} callback
 */
exports.send = function (to, subject, html, callback) {
  callback = callback || utility.noop;

  if (mailConfig.enable === false) {
    console.log('[send mail debug] [%s] to: %s, subject: %s\n%s', Date(), to, subject, html);
    return callback();
  }

  if (!transport) {
    transport = nodemailer.createTransport(smtpConfig);
  }

  var message = {
    from: mailConfig.from || mailConfig.sender,
    to: to,
    subject: subject,
    html: html,
  };

  transport.sendMail(message, function (err, result) {
    callback(err, result);
  });
};
