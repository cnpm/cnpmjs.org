'use strict';

module.exports = function* notFound(next) {
  yield next;

  if (this.status && this.status !== 404) {
    return;
  }
  if (this.body && this.body.name) {
    return;
  }

  this.status = 404;
  this.body = {
    error: 'not_found',
    reason: 'document not found'
  };
};
