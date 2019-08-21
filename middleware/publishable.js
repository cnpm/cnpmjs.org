'use strict';

/**
 * Module dependencies.
 */

var packageService = require('../services/package');

var util = require('util');
var config = require('../config');
var debug = require('debug')('cnpmjs.org:middlewares/publishable');

module.exports = function *publishable(next) {
  // admins always can publish and unpublish
  if (this.user.isAdmin) {
    return yield next;
  }

  // private mode, normal user can't publish and unpublish
  if (config.enablePrivate) {
    this.status = 403;
    const error = '[no_perms] Private mode enable, only admin can publish this module';
    this.body = {
      error,
      reason: error,
    };
    return;
  }

  // public mode, normal user have permission to publish `scoped package`
  // and only can publish with scopes in `ctx.user.scopes`, default is `config.scopes`

  var name = this.params.name || this.params[0];

  // check if is private package list in config
  if (config.privatePackages && config.privatePackages.indexOf(name) !== -1) {
    return yield next;
  }

  // check the package is already exists and is maintainer
  var result = yield packageService.authMaintainer(name, this.user.name);
  if (result.maintainers && result.maintainers.length) {
    if (result.isMaintainer) {
      return yield next;
    }
    this.status = 403;
    const error = '[forbidden] ' + this.user.name + ' not authorized to modify ' + name +
        ', please contact maintainers: ' + result.maintainers.join(', ');
    this.body = {
      error,
      reason: error,
    };
    return;
  }

  // scoped module
  if (name[0] === '@') {
    if (checkScope(name, this)) {
      return yield next;
    }
    return;
  }

  // none-scope
  assertNoneScope(name, this);
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
    const error = util.format('[invalid] scope %s not match legal scopes: %s', scope, ctx.user.scopes.join(', '));
    ctx.body = {
      error,
      reason: error,
    };
    return false;
  }

  return true;
}

/**
 * check if user have permission to publish without scope
 */

function assertNoneScope(name, ctx) {
  ctx.status = 403;
  if (ctx.user.scopes.length === 0) {
    const error = '[no_perms] can\'t publish non-scoped package, please set `config.scopes`';
    ctx.body = {
      error,
      reason: error,
    };
    return;
  }

  const error = '[no_perms] only allow publish with ' + ctx.user.scopes.join(', ') + ' scope(s)';
  ctx.body = {
    error,
    reason: error,
  };
}
