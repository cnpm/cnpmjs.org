'use strict';

var config = require('../../config');
var packageService = require('../../services/package');
var DownloadTotal = require('../../services/download_total');

exports.version = function* () {
  var color = 'grey';
  var name = this.params[0];
  var tag = this.query.tag || 'latest';
  var version = this.query.version;
  let info;
  if (version) {
    info = yield packageService.getModule(name, version);
  } else {
    info = yield packageService.getModuleByTag(name, tag);
  }
  if (info) {
    version = info.version;
    if (/^0\.0\./.test(version)) {
      // <0.1.0 & >=0.0.0
      color = 'red';
    } else if (/^0\./.test(version)) {
      // <1.0.0 & >=0.1.0
      color = 'green';
    } else {
      // >=1.0.0
      color = 'blue';
    }
  }

  var subject = config.badgeSubject;
  if (this.query.subject) {
    subject = this.query.subject;
  }
  if (!version) {
    version = 'invalid';
  }
  var style = this.query.style || 'flat-square';
  var url = config.badgeService.url(subject, version, { color, style });
  this.redirect(url);
};

exports.downloads = function* () {
  // https://dn-img-shields-io.qbox.me/badge/downloads-100k/month-brightgreen.svg?style=flat-square
  var name = this.params[0];
  var count = yield DownloadTotal.getTotalByName(name);
  var style = this.query.style;
  var url = config.badgeService.url('downloads', count, { style });
  this.redirect(url);
};
