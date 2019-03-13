'use strict';

module.exports = function *unpublishable(next) {
  // only admin user can unpublish
  if (!this.user.isAdmin) {
    this.status = 403;
    const error = '[no_perms] Only administrators can unpublish module';
    this.body = {
      error,
      reason: error,
    };
    return;
  }
  yield next;
};
