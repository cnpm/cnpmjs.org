'use strict';

var utils = require('../utils');
var markdown = require('../../common/markdown');

describe('common/markdown.test.js', () => {
  it('should render sonido readme', () => {
    var readme = utils.getFileContent('sonido.md');
    var md = markdown.render(readme);
    md.should.equal('<p>Configuration Wizard: &lt;!--- This is what the user will see during the configuration -&gt;</p>\n');
  });

  it('should filter xss', () => {
    var html = markdown.render('foo<script>alert(1)</script>/xss\n[foo](/foo) <a onclick="alert(1)">bar</a>\n"\'');
    html.should.equal('<p>foo&lt;script&gt;alert(1)&lt;/script&gt;/xss\n<a href="/foo">foo</a> <a>bar</a>\n&quot;\'</p>\n');
    markdown.render('[xss link](javascript:alert(2))').should.equal('<p>[xss link](javascript:alert(2))</p>\n');
  });

  it('should handle eat cpu markdown', () => {
    var readme = utils.getFileContent('eat-cpu.md');
    markdown.render(readme);
  });

  it('should not filter < and > on code', () => {
    var content = utils.getFileContent('code.md');
    var html = markdown.render(content);
    html.should.containEql('<pre><code class="language-html">&lt;body&gt;hi&lt;/body&gt;');
  });
});
