'use strict';

const nodemailer = require('nodemailer');
const utility = require('utility');
const os = require('os');
const mailConfig = require('../config').mail;

let smtpConfig;
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
      pass: mailConfig.pass,
    },
  };
}

let transport;

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

const LEVELS = [ 'log', 'warn', 'error' ];
LEVELS.forEach(function(level) {
  exports[level] = function(to, subject, html, callback) {
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

exports.send = function(to, subject, html, callback) {
  callback = callback || utility.noop;

  if (mailConfig.enable === false) {
    console.log('[send mail debug] [%s] to: %s, subject: %s\n%s', Date(), to, subject, html);
    return callback();
  }

  if (!transport) {
    transport = nodemailer.createTransport(smtpConfig);
  }

  const message = {
    from: mailConfig.from || mailConfig.sender,
    to,
    subject,
    html,
  };

  transport.sendMail(message, function(err, result) {
    callback(err, result);
  });
};
