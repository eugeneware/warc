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
