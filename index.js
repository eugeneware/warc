var stream = require('stream'),
    util = require('util');
module.exports = WARCStream;

var STATE = {
  PROTOCOL : 1,
  HEADERS  : 2
};

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
  do {
    switch (this.state) {
      case STATE.PROTOCOL:
        this.protocol = null;
        this.data = Buffer.concat([this.data, chunk]);
        result = this.parseProtocol();
        if (result) {
          this.state = STATE.HEADERS;
          this.emit('protocol', this.protocol);
        }
        break;

      case STATE.PROTOCOL:
        result = false;
        break;

      default:
        result = false;
        break;
    }
  } while (result);

  cb();
};

WARCStream.prototype._flush = function (cb) {
  cb();
};

WARCStream.prototype.parseProtocol = function () {
  var idx = firstMatch(this.matcher, this.data, this.offset);

  if (idx <= this.data.length) {
    var protocol = this.data.slice(this.offset, idx - this.offset);
    this.offset += idx + this.matcher.length;
    this.protocol = protocol.toString();
    return true;
  } else {
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
