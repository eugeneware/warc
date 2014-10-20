var it = require('tape'),
    path = require('path'),
    fs = require('fs'),
    through2 = require('through2'),
    WARCStream = require('..');

var watFile = 'CC-MAIN-20140820021334-00006-ip-10-180-136-8.ec2.internal.warc.wat';
var wetFile = 'CC-MAIN-20140820021334-00006-ip-10-180-136-8.ec2.internal.warc.wet';
function fixture(file) {
  return fs.createReadStream(path.join(__dirname, 'fixtures', file));
}

it('should be able to create a new stream', function(t) {
  var w = new WARCStream();
  t.ok(w);
  t.end();
});

it('should be able to parse the protocol', function(t) {
  t.plan(9*2);
  var f = fixture(watFile);
  var w = new WARCStream();
  var count = 0;
  f
    .pipe(w)
    .on('protocol', function (protocol) {
      t.equal(protocol, 'WARC/1.0');
      t.equal(w.protocol, 'WARC/1.0');
    })
});

it('should be able to parse the headers', function(t) {
  t.plan(9);
  var f = fixture(watFile);
  var w = new WARCStream();
  var first = true;
  f
    .pipe(w)
    .on('headers', function (headers) {
      if (first) {
        var expected = {
          'WARC-Type': 'warcinfo',
          'WARC-Date': '2014-09-09T10:14:59Z',
          'WARC-Filename': 'CC-MAIN-20140820021334-00006-ip-10-180-136-8.ec2.internal.warc.gz',
          'WARC-Record-ID': '<urn:uuid:e801b755-b208-4424-8233-b76f468155c6>',
          'Content-Type': 'application/warc-fields',
          'Content-Length': '108' };
        t.deepEquals(headers, expected);
        first = false;
      } else {
        t.ok(Object.keys(headers).length);
      }
    })
});

it('should be able to parse the content', function(t) {
  t.plan(9);
  var f = fixture(watFile);
  var w = new WARCStream();
  var first = true;
  f
    .pipe(w)
    .on('content', function (content) {
      if (first) {
        var expected = [
          'Software-Info: ia-web-commons.1.0-SNAPSHOT-20140819100050',
          'Extracted-Date: Tue, 09 Sep 2014 10:14:59 GMT',
          '',
          ''
        ].join('\r\n');
        t.equals(expected, content.toString());
        first = false;
      } else {
        t.ok(content);
      }
    })
});

it('should be able to send data events', function(t) {
  t.plan(10);
  var f = fixture(watFile);
  var w = new WARCStream();
  var results = [];
  f
    .pipe(w)
    .on('data', function (data) {
      results.push(data);
      t.ok(data);
    })
    .on('end', function () {
      t.equals(results.length, 9);
    });
});

it('should be able to worth with streams', function(t) {
  t.plan(10);
  var f = fixture(watFile);
  var w = new WARCStream();
  var results = [];
  f
    .pipe(w)
    .pipe(through2.obj(
      function (data, enc, cb) {
        results.push(data);
        t.ok(data);
        cb();
      },
      function () {
        t.equals(results.length, 9);
      }));
});

it('should be able to worth with WET files', function(t) {
  t.plan(3);
  var f = fixture(wetFile);
  var w = new WARCStream();
  var results = [];
  f
    .pipe(w)
    .pipe(through2.obj(
      function (data, enc, cb) {
        if (data.headers['Content-Type'] === 'text/plain') {
          t.ok(data.content.length);
        }
        cb();
      }));
});
