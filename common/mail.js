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

var utility = require('utility');
var nodemailer = require('nodemailer');
var os = require('os');
var mailConfig = require('../config').mail;

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

  var transport = nodemailer.createTransport("SMTP", {
    host: mailConfig.host,
    port: mailConfig.port,
    secureConnection: mailConfig.ssl,
    debug: mailConfig.debug,
    auth: {
      user: mailConfig.user,
      pass: mailConfig.pass,
    }
  });

  var message = {
    sender: mailConfig.sender,
    to: to,
    subject: subject,
    html: html,
  };

  transport.sendMail(message, function (err, result) {
    transport.close();
    callback(err, result);
  });
};
