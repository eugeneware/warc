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
  chunks.forEach(function (chunk) {
    var buf = new Buffer(chunk);
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
    'Content-Type: ', 'application/warc-fields\r\n',
    'Content-Len', 'gth: 108', '\r\n',
    '\r\n'
  ];

  chunks.forEach(function (chunk) {
    var buf = new Buffer(chunk);
    w.write(buf);
  });
});

it('should be able to parse content', function(t) {
  t.plan(3);
  var w = new WARCStream();
  w.on('protocol', function (protocol) {
    t.equal(protocol, 'WARC/1.0');
  })
  w.on('headers', function (headers) {
    var expected = {
      'Content-Type': 'application/warc-fields',
      'Content-Length': '108' };
    t.deepEquals(headers, expected);
  });
  w.on('content', function (content) {
    var expected = [
      'Software-Info: ia-web-commons.1.0-SNAPSHOT-20140819100050\r\n',
      'Extracted-Date: Tue, 09 Sep 2014 10:14:59 GMT\r\n',
      '\r\n'].join('');
    t.equals(content.toString(), expected);
  });
  var chunks = [
    'WARC/1.0\r\n',
    'Content-Type: ', 'application/warc-fields\r\n',
    'Content-Len', 'gth: 108', '\r\n',
    '\r\n',
    'Software-Info: ia-web-commons.1.0-SNAPSHOT-20140819100050\r\n',
    'Extracted-Date: Tue, 09 Sep 2014 10:14:59 GMT\r\n',
    '\r\n'
  ];

  chunks.forEach(function (chunk) {
    var buf = new Buffer(chunk);
    w.write(buf);
  });
});

it('should be able to parse split content', function(t) {
  t.plan(3);
  var w = new WARCStream();
  w.on('protocol', function (protocol) {
    t.equal(protocol, 'WARC/1.0');
  })
  w.on('headers', function (headers) {
    var expected = {
      'Content-Type': 'application/warc-fields',
      'Content-Length': '108' };
    t.deepEquals(headers, expected);
  });
  w.on('content', function (content) {
    var expected = [
      'Software-Info: ia-web-commons.1.0-SNAPSHOT-20140819100050\r\n',
      'Extracted-Date: Tue, 09 Sep 2014 10:14:59 GMT\r\n',
      '\r\n'].join('');
    t.equals(content.toString(), expected);
  });
  var chunks = [
    'WARC/1.0\r\n',
    'Content-Type: ', 'application/warc-fields\r\n',
    'Content-Len', 'gth: 108', '\r\n',
    '\r\n',
    'Software-Info:', ' ia-web-commons.1.0-SNAPSHOT-20140819100050\r\n',
    'Extracted-Date: Tue, ', '09 Sep 2014 10:14:59 GMT', '\r\n',
    '\r\n'
  ];

  chunks.forEach(function (chunk) {
    var buf = new Buffer(chunk);
    w.write(buf);
  });
});

it('should be able to parse across a packet boundary', function(t) {
  t.plan(6);
  var w = new WARCStream();
  w.on('protocol', function (protocol) {
    t.equal(protocol, 'WARC/1.0');
  })
  w.on('headers', function (headers) {
    var expected = {
      'Content-Type': 'application/warc-fields',
      'Content-Length': '108' };
    t.deepEquals(headers, expected);
  });
  w.on('content', function (content) {
    var expected = [
      'Software-Info: ia-web-commons.1.0-SNAPSHOT-20140819100050\r\n',
      'Extracted-Date: Tue, 09 Sep 2014 10:14:59 GMT\r\n',
      '\r\n'].join('');
    t.equals(content.toString(), expected);
  });
  var chunks = [
    'WARC/1.0\r\n',
    'Content-Type: ', 'application/warc-fields\r\n',
    'Content-Len', 'gth: 108', '\r\n',
    '\r\n',
    'Software-Info:', ' ia-web-commons.1.0-SNAPSHOT-20140819100050\r\n',
    'Extracted-Date: Tue, ', '09 Sep 2014 10:14:59 GMT', '\r\n',
    '\r\n',

    '\r\n',
    '\r\n',

    'WARC/1.0\r\n',
    'Content-Type: ', 'application/warc-fields\r\n',
    'Content-Len', 'gth: 108', '\r\n',
    '\r\n',
    'Software-Info:', ' ia-web-commons.1.0-SNAPSHOT-20140819100050\r\n',
    'Extracted-Date: Tue, ', '09 Sep 2014 10:14:59 GMT', '\r\n',
    '\r\n'
  ];

  chunks.forEach(function (chunk) {
    var buf = new Buffer(chunk);
    w.write(buf);
  });
});
