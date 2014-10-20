var stream = require('stream'),
    util = require('util');
module.exports = WARCStream;

var STATE = {
  PROTOCOL : 1,
  HEADERS  : 2,
  DATA     : 3
};

var headerRegex = /^([^\:]+)\: ([^$]+)$/;

function WARCStream(opts) {
  if (!(this instanceof WARCStream)) {
    return new WARCStream();
  }

  stream.Transform.call(this, opts);

  this.state = STATE.PROTOCOL;
  this.data = new Buffer(0);
  this.offset = 0;
  this.protocol = null;
  this.headers = {};
  this.matcher = new Buffer('\r\n');
}

util.inherits(WARCStream, stream.Transform);

WARCStream.prototype._transform = function (chunk, enc, cb) {
  var result;

  // append chunk
  this.data = Buffer.concat([this.data, chunk]);

  do {
    switch (this.state) {
      case STATE.PROTOCOL:
        this.protocol = null;
        result = this.parseProtocol();
        if (result) {
          this.state = STATE.HEADERS;
          this.headers = {};
          this.emit('protocol', this.protocol);
        }
        break;

      case STATE.HEADERS:
        result = false;
        result = this.parseHeaders();
        if (result) {
          this.emit('headers', this.headers);
        }
        break;

      default:
        result = false;
        break;
    }
  } while (result);

  // store only the part we haven't processed yet
  this.data = this.data.slice(this.offset);
  this.offset = 0;

  cb();
};

WARCStream.prototype._flush = function (cb) {
  cb();
};

WARCStream.prototype.parseProtocol = function () {
  var idx = firstMatch(this.matcher, this.data, this.offset);

  if (idx <= this.data.length) {
    var protocol = this.data.slice(this.offset, idx);
    this.offset = idx + this.matcher.length;
    this.protocol = protocol.toString();
    return true;
  } else {
    this.offset = idx;
    return false;
  }
};

WARCStream.prototype.parseHeaders = function () {
  var result;
  do {
    result = this.parseHeader();
  } while (result);
  return !result && this.state === STATE.DATA;
};

WARCStream.prototype.parseHeader = function () {
  var idx = firstMatch(this.matcher, this.data, this.offset);

  if (idx <= this.data.length) {
    var header= this.data.slice(this.offset, idx);
    this.offset = idx + this.matcher.length;

    if (header.length === 0) {
      this.state = STATE.DATA;
      return false;
    }

    var m = headerRegex.exec(header.toString());
    if (m) {
      this.headers[m[1]] = m[2];
    }
    return true;
  } else {
    console.log('header not found');
    this.offset = idx;
    return false;
  }
};

function firstMatch(matcher, buf, offset) {
  var i = offset;
  if (offset >= buf.length) return false;
  for (var i = offset; i < buf.length; i++) {
    if (buf[i] === matcher[0]) {
      if (matcher.length > 1) {
        var fullMatch = true;
        for (var j = i, k = 0; j < i + matcher.length; j++, k++) {
          if (buf[j] !== matcher[k]) {
            fullMatch = false;
            break;
          }
        }
        if (fullMatch) return j - matcher.length;
      } else {
        break;
      }
    }
  }

  var idx = i + matcher.length - 1;
  return idx;
}
