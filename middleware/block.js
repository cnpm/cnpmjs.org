'use strict';

module.exports = function () {
  return function* block(next) {
    var ua = String(this.get('user-agent')).toLowerCase();
    if (ua === 'ruby') {
      this.status = 403;
      return this.body = {
        message: 'forbidden Ruby user-agent, ip: ' + this.ip
      };
    }
    yield next;
  };
};
