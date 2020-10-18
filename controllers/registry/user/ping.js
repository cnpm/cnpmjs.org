'use strict';

const login = require('../../../middleware/login');

// https://docs.npmjs.com/cli/ping
module.exports = function* () {
  function response(ctx) {
    ctx.status = 200;
    ctx.body = {};
  }

  const ctx = this;
  if (this.query.write !== 'true') {
    return response(ctx);
  }

  yield login.apply(ctx, [ Promise.resolve() ]);
  response(ctx);
};
