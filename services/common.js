'use strict';

var config = require('../config');
var isPrivateScopedPackage = require('../lib/common').isPrivateScopedPackage;

config.privatePackages = config.privatePackages || [];

exports.isPrivatePackage = function (name) {
  if (isPrivateScopedPackage(name)) {
    return true;
  }
  if (config.privatePackages.indexOf(name) >= 0) {
    return true;
  }
  return false;
};
