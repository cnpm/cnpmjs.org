'use strict';

module.exports = function* unpublishable(next) {
  // only admin user can unpublish
  if (!this.user.isAdmin) {
    this.status = 403;
    this.body = {
      error: 'no_perms',
      reason: 'Only administrators can unpublish module',
    };
    return;
  }
  yield next;
};
