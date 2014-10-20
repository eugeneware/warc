var it = require('tape'),
    path = require('path'),
    fs = require('fs'),
    through2 = require('through2'),
    WARCStream = require('..');

var watFile = 'CC-MAIN-20140820021334-00006-ip-10-180-136-8.ec2.internal.warc.wat';
function fixture(file) {
  return fs.createReadStream(path.join(__dirname, 'fixtures', file));
}

it('should be able to create a new stream', function(t) {
  var w = new WARCStream();
  t.ok(w);
  t.end();
});

it('should be able to parse the protocol', function(t) {
  var f = fixture(watFile);
  var w = new WARCStream();
  f
    .pipe(w)
    .on('protocol', function (protocol) {
      t.equal(protocol, 'WARC/1.0');
      t.equal(w.protocol, 'WARC/1.0');
      t.end();
    })
});

it('should be able to parse the headers', function(t) {
  var f = fixture(watFile);
  var w = new WARCStream();
  f
    .pipe(w)
    .on('headers', function (headers) {
      var expected = {
        'WARC-Type': 'warcinfo',
        'WARC-Date': '2014-09-09T10:14:59Z',
        'WARC-Filename': 'CC-MAIN-20140820021334-00006-ip-10-180-136-8.ec2.internal.warc.gz',
        'WARC-Record-ID': '<urn:uuid:e801b755-b208-4424-8233-b76f468155c6>',
        'Content-Type': 'application/warc-fields',
        'Content-Length': '108' };
      t.deepEquals(headers, expected);
      t.end();
    })
});
