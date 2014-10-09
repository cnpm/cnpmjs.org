/**!
 * cnpmjs.org - test/sendmail.js
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

var mail = require('../common/mail');


mail.warn('fengmk2@gmail.com', '这是一封测试邮件', '<h1>忽略我吧</h1>', function (err) {
  if (err) {
    throw err;
  }
  console.log(arguments);
  process.exit(0);
});
