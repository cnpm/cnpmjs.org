var zlib = require('zlib');

var stream = zlib.createGzip();

stream.write('foo');
stream.close();

// Assertion failed: (!ctx->pending_close_ && "close is pending"), function Write, file ../src/node_zlib.cc, line 150.
stream.write('again');
