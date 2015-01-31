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

var xss = require('xss');
var MarkdownIt = require('markdown-it');

var md = new MarkdownIt({
  html: true,
  linkify: true,
});

exports.render = function (content, filterXss) {
  return md.render(filterXss === false ? content : xss(content));
};
