'use strict';

var utility = require('utility');
var util = require('util');
var config = require('../../config');
var packageService = require('../../services/package');
var DownloadTotal = require('../../services/download_total');

exports.version = function* () {
  var color = 'lightgrey';
  var version = 'invalid';
  var name = this.params[0];
  var tag = this.query.tag || 'latest';
  var info = yield packageService.getModuleByTag(name, tag);
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

  var subject = config.badgeSubject.replace(/\-/g, '--');
  if (this.query.subject) {
    subject = this.query.subject.replace(/\-/g, '--');
  }
  version = version.replace(/\-/g, '--');
  var style = this.query.style || 'flat-square';
  var url = util.format(config.badgePrefixURL + '/%s-%s-%s.svg?style=%s',
    utility.encodeURIComponent(subject), version, color, utility.encodeURIComponent(style));
  this.redirect(url);
};

exports.downloads = function* () {
  // https://dn-img-shields-io.qbox.me/badge/downloads-100k/month-brightgreen.svg?style=flat-square
  var name = this.params[0];
  var count = yield DownloadTotal.getTotalByName(name);
  var style = this.query.style || 'flat-square';
  var url = util.format(config.badgePrefixURL + '/downloads-%s-brightgreen.svg?style=%s',
    count, utility.encodeURIComponent(style));
  this.redirect(url);
};
