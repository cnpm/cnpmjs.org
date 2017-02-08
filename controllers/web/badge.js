/**!
 * cnpmjs.org - controllers/web/badge.js
 *
 * Copyright(c) fengmk2 and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.com)
 */

'use strict';

/**
 * Module dependencies.
 */

const utility = require('utility');
const util = require('util');
const config = require('../../config');
const packageService = require('../../services/package');
const DownloadTotal = require('../../services/download_total');

exports.version = function* () {
  let color = 'lightgrey';
  let version = 'invalid';
  const name = this.params[0];
  const tag = this.query.tag || 'latest';
  const info = yield packageService.getModuleByTag(name, tag);
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

  let subject = config.badgeSubject.replace(/\-/g, '--');
  if (this.query.subject) {
    subject = this.query.subject.replace(/\-/g, '--');
  }
  version = version.replace(/\-/g, '--');
  const style = this.query.style || 'flat-square';
  const url = util.format(config.badgePrefixURL + '/%s-%s-%s.svg?style=%s',
    utility.encodeURIComponent(subject), version, color, utility.encodeURIComponent(style));
  this.redirect(url);
};

exports.downloads = function* () {
  // https://dn-img-shields-io.qbox.me/badge/downloads-100k/month-brightgreen.svg?style=flat-square
  const name = this.params[0];
  const count = yield DownloadTotal.getTotalByName(name);
  const style = this.query.style || 'flat-square';
  const url = util.format(config.badgePrefixURL + '/downloads-%s-brightgreen.svg?style=%s',
    count, utility.encodeURIComponent(style));
  this.redirect(url);
};
