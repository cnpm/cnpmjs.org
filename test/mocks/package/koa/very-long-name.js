'use strict';

module.exports = {
  package: {
    name: 'inch-plugin-socket-behaviour-desktop',
    description: description(),
  },
  __requires: [ './default' ],
};

function description() {
  let s = '';
  for (let i = 0; i < 10; i++) {
    s += 'description: Koa web app framework';
  }
  return s;
}
