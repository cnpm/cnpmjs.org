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

// allow class attr on code
xss.whiteList.code = ['class'];

var md = new MarkdownIt({
  html: true,
  linkify: true,
});

exports.render = function (content, filterXss) {
  var html = md.render(content);
  if (filterXss !== false) {
    html = xss(html);
  }
  return html;
};
