/**!
 * cnpmjs.org - common/markdown.js
 *
 * Copyright(c) fengmk2 and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var marky = require('marky-markdown');

exports.render = function (content, filterXss) {
  var sanitize = filterXss === false ? false : true;
  return marky(content, {
    sanitize: sanitize,
    serveImagesWithCDN: false,
    highlightSyntax: true,
    debug: false,
    package: null, // TODO
  }).html();
};
