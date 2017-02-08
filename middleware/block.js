'use strict';

module.exports = () => {
  return function* block(next) {
    const ua = String(this.get('user-agent')).toLowerCase();
    if (ua === 'ruby') {
      this.status = 403;
      this.body = {
        message: 'forbidden Ruby user-agent, ip: ' + this.ip,
      };
      return;
    }
    yield next;
  };
};
