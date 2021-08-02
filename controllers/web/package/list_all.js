'use strict';

var packageService = require('../../../services/package');

module.exports = function* listAllModules() {
  var tasks = {};

  tasks = packageService.listAllModules()

  var packages = yield tasks;
  yield this.render('all', {
    title: 'all packages',
    packages: packages
  });
};