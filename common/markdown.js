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

// var Remarkable = require('remarkable');
//
// var md = new Remarkable();
// md.set({
//   html: true
// });

var marked = require('marked');
// marked.setOptions({
//
// });

exports.render = function (content) {
  // return md.render(content);
  return marked(content);
};
