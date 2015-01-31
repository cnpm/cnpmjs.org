/**
 * CORS middleware
 *
 * @param {Object} [settings]
 * @return {Function}
 * @api public
 */
module.exports = function(settings) {
  "use strict";
  var defaults = {
    origin: function(ctx) {
      return ctx.get('origin') || '*';
    },
    methods: 'GET,HEAD,PUT,POST,DELETE'
  };

  /**
   * Set options
   *
   * @type {Object}
   */
  var options = settings || defaults;
  if (options.origin !== false) {
    var t = typeof options.origin;
    if (t !== 'string' && t !== 'function') {
      options.origin = defaults.origin;
    }
  }

  if (Array.isArray(options.expose)) {
    options.expose = options.expose.join(',');
  }

  options.maxAge = options.maxAge && options.maxAge.toString();

  options.methods = options.methods || defaults.methods;
  if (Array.isArray(options.methods)) {
    options.methods = options.methods.join(',');
  }

  if (Array.isArray(options.headers)) {
    options.headers = options.headers.join(',');
  }

  return function* cors(next) {
    /**
     * Access Control Allow Origin
     */

    var origin = options.origin;
    if (origin === false) {
      return yield* next;
    }

    if (typeof options.origin === 'function') {
      origin = options.origin(this);
    }

    if (origin === false) {
      return yield* next;
    }

    this.set('Access-Control-Allow-Origin', origin);

    /**
     * Access Control Expose Headers
     */
    if (options.expose) {
      this.set('Access-Control-Expose-Headers', options.expose);
    }

    /**
     * Access Control Max Age
     */

    if (options.maxAge) {
      this.set('Access-Control-Max-Age', options.maxAge);
    }

    /**
     * Access Control Allow Credentials
     */
    if (options.credentials === true) {
      this.set('Access-Control-Allow-Credentials', 'true');
    }

    /**
     * Access Control Allow Methods
     */
    this.set('Access-Control-Allow-Methods', options.methods);

    /**
     * Access Control Allow Headers
     */
    var allowHeaders = options.headers;
    if (!allowHeaders) {
      allowHeaders = this.get('access-control-request-headers');
    }
    if (allowHeaders) {
      this.set('Access-Control-Allow-Headers', allowHeaders);
    }

    /**
     * Returns
     */
    if (this.method === 'OPTIONS') {
      this.status = 204;
    } else {
      yield* next;
    }
  };

};
