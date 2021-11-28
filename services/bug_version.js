'use strict';

const config = require('../config');
const packageService = require('./package');

// replace bug version and set deprecated property for cli tooltip
exports.hotfix = function* (rows) {
  if (!config.enableBugVersion) {
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
  const bugs = bugVersions && bugVersions[row.package.name];
  if (!bugs) {
    return;
  }

  const existsVerionsMap = {};
  for (row of rows) {
    existsVerionsMap[row.version] = true;
  }

  for (row of rows) {
    const bug = bugs[row.version];
    if (bug && bug.version && existsVerionsMap[bug.version]) {
      const hotfixDeprecated = `[WARNING] Use ${bug.version} instead of ${row.version}, reason: ${bug.reason}`;
      row.package.deprecated = row.package.deprecated ? `${row.package.deprecated} (${hotfixDeprecated})` : hotfixDeprecated;
    }
  }
};

exports.getHotfixVersion = function* (name, version) {
  if (!config.enableBugVersion) {
    return;
  }
  const moduleRow = yield packageService.getLatestModule('bug-versions');
  if (!moduleRow) {
    return;
  }
  const bugVersions = moduleRow.package['bug-versions'];
  const bugs = bugVersions && bugVersions[name];
  if (!bugs) {
    return;
  }

  const bug = bugs[version];
  if (bug && bug.version) {
    // make sure hotfix version exists
    const row = yield packageService.getModule(name, bug.version);
    if (row) {
      return row.version;
    }
  }
};
