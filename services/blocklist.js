'use strict';

const BlockPackageVersion = require('../models').BlockPackageVersion;

exports.blockPackageVersion = function* (name, version, reason) {
  const row = yield BlockPackageVersion.findOne({ where: { name, version } });
  if (row) {
    row.reason = reason;
    yield row.save();
  } else {
    yield BlockPackageVersion.create({ name, version, reason });
  }
};

exports.findBlockPackageVersions = function* (name) {
  if (!BlockPackageVersion) {
    return null;
  }
  const rows = yield BlockPackageVersion.findAll({ where: { name } });
  if (rows.length === 0) {
    return null;
  }
  const blocks = {};
  for (const row of rows) {
    blocks[row.version] = row;
  }
  return blocks;
};
