/**!
 * cnpmjs.org - controllers/web/package/show_sync.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

module.exports = function* showSync() {
  var name = this.params.name || this.params[0] || this.query.name;
  if (!name) {
    return this.redirect('/');
  }
  yield this.render('sync', {
    name: name,
    title: 'Sync - ' + name,
  });
};
