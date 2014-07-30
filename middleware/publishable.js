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

var util = require('util');
var config = require('../config');
var debug = require('debug')('cnpmjs.org:middlewares/publishable');

module.exports = function *publishable(next) {
  // private mode, only admin user can publish
  if (config.enablePrivate && !this.user.isAdmin) {

    this.status = 403;
    this.body = {
      error: 'no_perms',
      reason: 'Private mode enable, only admin can publish this module'
    };
    return;
  }

  // public mode, all user have permission to publish
  // but if `config.scopes` exist, only can publish with scopes in `config.scope`
  // if `config.forcePublishWithScope` set to true, only admins can publish without scope

  var name = this.params.name || this.params[0];

  // check if is private package list in config
  if (config.privatePackages && config.privatePackages.indexOf(name) !== -1) {
    return yield* next;
  }

  // scope
  if (name[0] === '@') {
    if (checkScope(name, this)) {
      return yield* next;
    }
    return;
  }

  // none-scope
  if (checkNoneScope(this)) {
    return yield* next;
  }
};

/**
 * check module's scope legal
 */

function checkScope(name, ctx) {
  if (!ctx.user.scopes || !ctx.user.scopes.length) {
    ctx.status = 404;
    return false;
  }

  var scope = name.split('/')[0];
  if (ctx.user.scopes.indexOf(scope) === -1) {
    debug('assert scope  %s error', name);
    ctx.status = 400;
    ctx.body = {
      error: 'invalid scope',
      reason: util.format('scope %s not match legal scopes %j', scope, ctx.user.scopes)
    };
    return false;
  }

  return true;
}

/**
 * check if user have permission to publish without scope
 */

function checkNoneScope(ctx) {
  if (!config.scopes
    || !config.scopes.length
    || !config.forcePublishWithScope) {
    return true;
  }

  // only admins can publish or unpublish non-scope modules
  if (ctx.user.isAdmin) {
    return true;
  }

  ctx.status = 403;
  ctx.body = {
    error: 'no_perms',
    reason: 'only allow publish with ' + ctx.user.scopes.join(',') + ' scope(s)'
  };
}
