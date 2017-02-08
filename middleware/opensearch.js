'use strict';

const template = `<?xml version="1.0" encoding="UTF-8"?>
 <OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/">
   <ShortName>CNPM</ShortName>
   <Description>Search packages in CNPM.</Description>
   <Tags>CNPM</Tags>
    <Url method="get" type="text/html" template="http://{{host}}/browse/keyword/{searchTerms}"/>
 </OpenSearchDescription>`;

module.exports = function* opensearch(next) {
  if (this.path === '/opensearch.xml') {
    this.type = 'text/xml';
    this.charset = 'utf-8';
    this.body = template.replace('{{host}}', this.host);
    return;
  }
  yield next;
};
