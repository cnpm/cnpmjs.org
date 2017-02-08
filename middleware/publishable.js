'use strict';

const util = require('util');
const config = require('../config');
const debug = require('debug')('cnpmjs.org:middlewares/publishable');

module.exports = function* publishable(next) {
  // admins always can publish and unpublish
  if (this.user.isAdmin) {
    return yield next;
  }

  // private mode, normal user can't publish and unpublish
  if (config.enablePrivate) {
    this.status = 403;
    this.body = {
      error: 'no_perms',
      reason: 'Private mode enable, only admin can publish this module',
    };
    return;
  }

  // public mode, normal user have permission to publish `scoped package`
  // and only can publish with scopes in `ctx.user.scopes`, default is `config.scopes`

  const name = this.params.name || this.params[0];

  // check if is private package list in config
  if (config.privatePackages && config.privatePackages.indexOf(name) !== -1) {
    return yield next;
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

  const scope = name.split('/')[0];
  if (ctx.user.scopes.indexOf(scope) === -1) {
    debug('assert scope  %s error', name);
    ctx.status = 400;
    ctx.body = {
      error: 'invalid scope',
      reason: util.format('scope %s not match legal scopes: %s', scope, ctx.user.scopes.join(', ')),
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
    ctx.body = {
      error: 'no_perms',
      reason: 'can\'t publish non-scoped package, please set `config.scopes`',
    };
    return;
  }

  ctx.body = {
    error: 'no_perms',
    reason: 'only allow publish with ' + ctx.user.scopes.join(', ') + ' scope(s)',
  };
}
