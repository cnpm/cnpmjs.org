#!/bin/bash
set -eu

cd "${CNPM_DIR}"
mysql -h "${CNPM_MYSQL_HOST}" -P "${CNPM_MYSQL_PORT}" \
     -u "${CNPM_MYSQL_USER}" --password="${CNPM_MYSQL_PASSWORD}" \
     "${CNPM_MYSQL_DBNAME}" < docs/db.sql

node dispatch.js
