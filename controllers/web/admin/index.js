'use strict';

var fs = require('fs');
var path = require('path');

exports.user = require('./user');

exports.admin = function* () {
  this.type = 'html';
  this.body = fs.createReadStream(path.join(path.dirname(__dirname), '../../view/web/admin', 'index.html'));
};
