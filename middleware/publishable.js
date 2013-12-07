/**!
 * cnpmjs.org - middleware/publishable.js
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

module.exports = function publishable(req, res, next) {
  if (req.session.onlySync && !req.session.isAdmin) {
    // private mode, only admin user can publish
    return res.json(403, {
      error: 'no_perms',
      reason: 'Private mode enable, only admin can publish this module'
    });
  }
  next();
};
