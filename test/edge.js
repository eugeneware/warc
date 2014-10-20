var it = require('tape'),
    path = require('path'),
    fs = require('fs'),
    through2 = require('through2'),
    WARCStream = require('..');

it('should be able to parse the protocol', function(t) {
  t.plan(1);
  var w = new WARCStream();
  w.on('protocol', function (protocol) {
    t.equal('WARC/1.0', protocol);
  })
  w.write(new Buffer('WARC/1.0\r\n'));
});

it('should be able to parse a split', function(t) {
  t.plan(1);
  var w = new WARCStream();
  w.on('protocol', function (protocol) {
    t.equal('WARC/1.0', protocol);
  })
  w.write(new Buffer('WARC/'));
  w.write(new Buffer('1.0'));
  w.write(new Buffer('\r\n'));
});

it('should be able to parse the headers', function(t) {
  t.plan(2);
  var w = new WARCStream();
  w.on('protocol', function (protocol) {
    t.equal('WARC/1.0', protocol);
  })
  w.on('headers', function (headers) {
    var expected = {
      'Content-Type': 'application/warc-fields',
      'Content-Length': '108' };
    t.deepEquals(headers, expected);
  });
  var buf = new Buffer([
    'WARC/1.0',
    'Content-Type: application/warc-fields',
    'Content-Length: 108',
    '',
    ''
  ].join('\r\n'));
  var chunks = [
    'WARC/1.0\r\n' +
    'Content-Type: application/warc-fields\r\n' +
    'Content-Length: 108\r\n' +
    '\r\n'
  ];
  var c = 0;
  chunks.forEach(function (chunk) {
    var buf = new Buffer(chunk);
    c += buf.length;
    w.write(buf);
  });
});

it('should be able to parse split headers', function(t) {
  t.plan(2);
  var w = new WARCStream();
  w.on('protocol', function (protocol) {
    t.equal('WARC/1.0', protocol);
  })
  w.on('headers', function (headers) {
    var expected = {
      'Content-Type': 'application/warc-fields',
      'Content-Length': '108' };
    t.deepEquals(headers, expected);
  });
  var chunks = [
    'WARC/1.0\r\n',
    'Content-Type: application/warc-fields\r\n',
    'Content-Length: 108\r\n',
    '\r\n'
  ];

  var c = 0;
  chunks.forEach(function (chunk) {
    var buf = new Buffer(chunk);
    c += buf.length;
    w.write(buf);
  });
});
