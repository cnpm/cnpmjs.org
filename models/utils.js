/**!
 * cnpmjs.org - models/utils.js
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

exports.JSONGetter = function (propertyName) {
  return function JSONGetter() {
    var value = this.getDataValue(propertyName);
    if (value && typeof value === 'string') {
      value = JSON.parse(value);
    }
    return value;
  };
};

exports.JSONSetter = function (propertyName) {
  return function JSONSetter(value) {
    if (typeof value !== 'string') {
      value = JSON.stringify(value);
    }
    this.setDataValue(propertyName, value);
  };
};
