'use strict';

const config = require('../config');
const packageService = require('./package');

// replace bug version and set deprecated property for cli tooltip
exports.hotfix = function* (rows) {
  if (!config.enableBugVersions) {
    return;
  }
  let row = rows[0];
  if (!row) {
    return;
  }
  // https://github.com/cnpm/bug-versions/blob/master/package.json#L118
  // "bug-versions": {
  //   "gifsicle": {
  //     "5.3.0": {
  //       "version": "5.2.1",
  //       "reason": "https://github.com/imagemin/gifsicle-bin/issues/133"
  //     }
  //   },
  const moduleRow = yield packageService.getLatestModule('bug-versions');
  if (!moduleRow) {
    return;
  }
  const bugVersions = moduleRow.package['bug-versions'];
  const bugs = bugVersions[row.package.name];
  if (!bugs) {
    return;
  }
  const hotfixVersions = {};
  for (const key in bugs) {
    const bug = bugs[key];
    if (!hotfixVersions[bug.version]) {
      hotfixVersions[bug.version] = {};
    }
  }
  for (row of rows) {
    if (hotfixVersions[row.package.version]) {
      hotfixVersions[row.package.version] = row.package;
    }
  }

  for (row of rows) {
    if (!row.package) {
      continue;
    }
    const bug = bugs[row.package.version];
    if (bug && hotfixVersions[bug.version]) {
      const hotfixDeprecated = `[WARNING] Use ${bug.version} instead of ${row.package.version}, reason: ${bug.reason}`;
      const deprecated = row.package.deprecated ? `${row.package.deprecated} (${hotfixDeprecated})` : hotfixDeprecated;
      // keep version don't change
      row.package = Object.assign({}, hotfixVersions[bug.version], { version: row.package.version, deprecated });
    }
  }
};
