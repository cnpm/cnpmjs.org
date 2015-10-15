module.exports = {
  package: {
    name: 'inch-plugin-socket-behaviour-desktop',
    description: description()
  },
  __requires: ['./default']
};

function description() {
  var s = ''
  for (var i = 0; i < 10; i++) {
    s += 'description: Koa web app framework'
  }
  return s
}
