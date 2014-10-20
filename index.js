var stream = require('stream'),
    util = require('util');
module.exports = WARCStream;

var STATE = {
  PROTOCOL  : 1,
  HEADERS   : 2,
  CONTENT   : 3,
  SEPARATOR : 4
};

var headerRegex = /^([^\:]+)\: ([^$]+)$/;

function WARCStream(opts) {
  if (!(this instanceof WARCStream)) {
    return new WARCStream();
  }

  if (typeof opts === 'undefined') {
    opts = {};
  }
  if (typeof opts.objectMode === 'undefined') {
    opts.objectMode = true;
  }

  stream.Transform.call(this, opts);

  this.state = STATE.PROTOCOL;
  this.data = new Buffer(0);
  this.content = new Buffer(0);
  this.separator = new Buffer('\r\n\r\n');
  this.offset = 0;
  this.protocol = null;
  this.headers = {};
  this.contentLength = 0;
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
          this.contentLength = parseInt(this.headers['Content-Length']);
          this.content = new Buffer(0);
          this.emit('headers', this.headers);
        }
        break;

      case STATE.CONTENT:
        result = this.parseContent();
        if (result) {
          this.state = STATE.SEPARATOR;
          this.emit('content', this.content);
          this.push({
            protocol: this.protocol,
            headers: this.headers,
            content: this.content
          });
        }
        break;

      case STATE.SEPARATOR:
        result = this.parseSeparator();
        if (result) {
          this.state = STATE.PROTOCOL;
        }
        break;

      default:
        result = false;
        break;
    }
  } while (result && this.offset < this.data.length);

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

  if (idx !== false && idx <= this.data.length) {
    var protocol = this.data.slice(this.offset, idx);
    this.offset = idx + this.matcher.length;
    this.protocol = protocol.toString();
    return true;
  } else {
    return false;
  }
};

WARCStream.prototype.parseHeaders = function () {
  var result;
  do {
    result = this.parseHeader();
  } while (result);
  return !result && this.state === STATE.CONTENT;
};

WARCStream.prototype.parseHeader = function () {
  var idx = firstMatch(this.matcher, this.data, this.offset);

  if (idx !== false && idx < this.data.length) {
    var header= this.data.slice(this.offset, idx);
    this.offset = idx + this.matcher.length;

    if (header.length === 0) {
      this.state = STATE.CONTENT;
      return false;
    }

    var m = headerRegex.exec(header.toString());
    if (m) {
      this.headers[m[1]] = m[2];
    }
    return true;
  } else {
    return false;
  }
};

WARCStream.prototype.parseContent = function () {
  var appendLength = Math.min(
    this.data.length - this.offset,
    this.contentLength - this.content.length);
  this.content = Buffer.concat([
    this.content, this.data.slice(this.offset, this.offset + appendLength)]);
  this.offset += appendLength;
  return this.contentLength === this.content.length;
};

WARCStream.prototype.parseSeparator = function () {
  var idx = firstMatch(this.separator, this.data, this.offset);

  if (idx !== false && idx < this.data.length) {
    var separator = this.data.slice(this.offset, idx);
    this.offset = idx + this.separator.length;
    if (separator.length === 0) {
      return true;
    }
  }

  return false;
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
