/**!
 * cnpmjs.org - test/common/markdown.test.js
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

var path = require('path');
var fs = require('fs');
var markdown = require('../../common/markdown');

describe('common/markdown.test.js', function () {
  var fixtures = path.join(__dirname, '..', 'fixtures');

  it('should render sonido readme', function () {
    var readme = fs.readFileSync(path.join(fixtures, 'sonido.md'), 'utf8');
    var md = markdown.render(readme);
    md.should.equal('<p>Configuration Wizard: &lt;!--- This is what the user will see during the configuration -&gt;</p>\n');
  });

  it('should filter xss', function () {
    var html = markdown.render('foo<script>alert(1)</script>/xss\n[foo](/foo) <a onclick="alert(1)">bar</a>\n"\'');
    // console.log(html);
    html.should.equal('<p>foo&lt;script&gt;alert(1)&lt;/script&gt;/xss\n<a href="/foo">foo</a> <a>bar</a>\n&quot;\'</p>\n');
    markdown.render('[xss link](javascript:alert(2))').should.equal('<p>[xss link](javascript:alert(2))</p>\n');
  });

  it('should handle eat cpu markdown', function () {
    // http://cnpmjs.org/package/chewer
    var MarkdownIt = require('markdown-it');

    var md = new MarkdownIt({
      html: true,
      linkify: true,
    });
    var readme = fs.readFileSync(path.join(fixtures, 'eat-cpu.md'), 'utf8');
    md.render(readme);
  });
});
