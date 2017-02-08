'use strict';

const ms = require('humanize-ms');
const cleanNpmMetadata = require('normalize-registry-metadata');
const urllib = require('../common/urllib');
const config = require('../config');

const USER_AGENT = 'npm_service.cnpmjs.org/' + config.version + ' ' + urllib.USER_AGENT;

function* request(url, options) {
  options = options || {};
  options.dataType = options.dataType || 'json';
  options.timeout = options.timeout || 120000;
  options.headers = {
    'user-agent': USER_AGENT,
  };
  options.gzip = true;
  options.followRedirect = true;
  const registry = options.registry || config.sourceNpmRegistry;
  url = registry + url;
  let r;
  try {
    r = yield urllib.request(url, options);
    // https://github.com/npm/registry/issues/87#issuecomment-261450090
    if (options.dataType === 'json' && r.data && config.officialNpmReplicate === registry) {
      cleanNpmMetadata(r.data);
    }
  } catch (err) {
    const statusCode = err.status || -1;
    const data = err.data || '[empty]';
    if (err.name === 'JSONResponseFormatError' && statusCode >= 500) {
      err.name = 'NPMServerError';
      err.status = statusCode;
      err.message = 'Url: ' + url + ', Status ' + statusCode + ', ' + data.toString();
    }
    throw err;
  }
  return r;
}

exports.request = request;

exports.getUser = function* (name) {
  const url = '/-/user/org.couchdb.user:' + name;
  const r = yield request(url);
  let data = r.data;
  if (data && !data.name) {
    // 404
    data = null;
  }
  return data;
};

exports.get = function* (name) {
  const r = yield request('/' + name);
  let data = r.data;
  if (r.status === 404) {
    data = null;
  }
  return data;
};

exports.fetchUpdatesSince = function* (lastSyncTime, timeout) {
  const lastModified = lastSyncTime - ms('10m');
  const data = yield exports.getAllSince(lastModified, timeout);
  const result = {
    lastModified: lastSyncTime,
    names: [],
  };
  if (!data) {
    return result;
  }
  if (Array.isArray(data)) {
    // support https://registry.npmjs.org/-/all/static/today.json
    let maxModified;
    data.forEach(function(pkg) {
      if (pkg.time && pkg.time.modified) {
        const modified = Date.parse(pkg.time.modified);
        if (modified >= lastModified) {
          result.names.push(pkg.name);
        }
        if (!maxModified || modified > maxModified) {
          maxModified = modified;
        }
      } else {
        result.names.push(pkg.name);
      }
    });
    if (maxModified) {
      result.lastModified = maxModified;
    }
  } else {
    // /-/all/since
    if (data._updated) {
      result.lastModified = data._updated;
      delete data._updated;
    }
    result.names = Object.keys(data);
  }
  return result;
};

exports.fetchAllPackagesSince = function* (timestamp) {
  const r = yield request('/-/all/static/all.json', {
    registry: 'http://registry.npmjs.org',
    timeout: 600000,
  });
  // {"_updated":1441520402174,"0":{"name":"0","dist-tags
  // "time":{"modified":"2014-06-17T06:38:43.495Z"}
  const data = r.data;
  const result = {
    lastModified: timestamp,
    lastModifiedName: null,
    names: [],
  };
  let maxModified;
  for (const key in data) {
    if (key === '_updated') {
      continue;
    }
    const pkg = data[key];
    if (!pkg.time || !pkg.time.modified) {
      continue;
    }
    const modified = Date.parse(pkg.time.modified);
    if (modified >= timestamp) {
      result.names.push(pkg.name);
    }
    if (!maxModified || modified > maxModified) {
      maxModified = modified;
      result.lastModifiedName = pkg.name;
    }
  }
  if (maxModified) {
    result.lastModified = maxModified;
  }
  return result;
};

exports.getAllSince = function* (startkey, timeout) {
  const r = yield request('/-/all/since?stale=update_after&startkey=' + startkey, {
    timeout: timeout || 300000,
  });
  return r.data;
};

exports.getAllToday = function* (timeout) {
  const r = yield request('/-/all/static/today.json', {
    timeout: timeout || 300000,
  });
  // data is array: see https://registry.npmjs.org/-/all/static/today.json
  return r.data;
};

exports.getShort = function* (timeout) {
  const r = yield request('/-/short', {
    timeout: timeout || 300000,
    // registry.npmjs.org/-/short is 404 now therefore have a fallback
    registry: config.sourceNpmRegistryIsCNpm ? config.sourceNpmRegistry : 'http://r.cnpmjs.org',
  });
  return r.data;
};

exports.getPopular = function* (top, timeout) {
  const r = yield request('/-/_view/dependedUpon?group_level=1', {
    registry: config.officialNpmRegistry,
    timeout: timeout || 120000,
  });
  if (!r.data || !r.data.rows || !r.data.rows.length) {
    return [];
  }

  // deps number must >= 100
  const rows = r.data.rows.filter(function(a) {
    return a.value >= 100;
  });

  return rows.sort(function(a, b) {
    return b.value - a.value;
  })
  .slice(0, top)
  .map(function(r) {
    return [ r.key && r.key[0] && r.key[0].trim(), r.value ];
  })
  .filter(function(r) {
    return r[0];
  });
};
