/**!
 * cnpmjs.org - middleware/opensearch.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 */

'use strict';

/**
 * Module dependencies.
 */

var template = '<?xml version="1.0" encoding="UTF-8"?>\
 <OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/">\
   <ShortName>CNPM</ShortName>\
   <Description>Search packages in CNPM.</Description>\
   <Tags>CNPM</Tags>\
    <Url method="get" type="text/html" template="http://${host}/browse/keyword/{searchTerms}"/>\
 </OpenSearchDescription>';

var lastModifyDate = new Date();

module.exports = function *publishable(next) {
  this.type = 'text/xml';
  this.charset = 'utf-8';
  this.body = template.replace('${host}', this.host);
};
