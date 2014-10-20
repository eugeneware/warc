# warc

Parse WARC (Web Archive Files) as a node.js stream

[![build status](https://secure.travis-ci.org/eugeneware/warc.png)](http://travis-ci.org/eugeneware/warc)

This stream parses the Web Archive file format as used by the
[Common Crawl](http://commoncrawl.org/the-data/get-started/) project.

NB: That this stream doesn't do any gzip decompression, it assumes a
decompressed WARC file format. The WARC files that use used by common-crawl
are actually multi-part Gzip files, and there is a [big bug](https://github.com/joyent/node/pull/6442) with the `zlib` library which is present as of the time of writing (node `0.10.32`) which
will only process the first gzipped chunk.

## Installation

This module is installed via npm:

``` bash
$ npm install warc
```

## Example Usage

Assumes an uncompressed WARC stream. The `content` field will be returned as a
node `Buffer`.

``` js
var WARCStream = require('warc'),
    fs = require('fs');

var w = new WARCStream();
fs.createReadStream('./CC-MAIN-20140820021334-00006-ip-10-180-136-8.ec2.internal.warc.wat')
  .pipe(w)
  .on('data', function (data) {
    console.log(data);
    /*
    { protocol: 'WARC/1.0',
      headers:
       { 'WARC-Type': 'response',
         'WARC-Date': '2014-08-21T04:21:14Z',
         'WARC-Record-ID': '<urn:uuid:edad822f-2290-4827-a5ab-a52a60348461>',
         'Content-Length': '174',
         'Content-Type': 'application/http; msgtype=response',
         'WARC-Warcinfo-ID': '<urn:uuid:cf083d66-9910-45e2-b5be-a421f9889aac>',
         'WARC-Concurrent-To': '<urn:uuid:9994d4fd-40b0-4d41-b1e7-1dc2a7ccb1e7>',
         'WARC-IP-Address': '65.52.108.2',
         'WARC-Target-URI': 'http://0.r.msn.com/?ld=7v7Pf0o6dfvcggjmXvvsEKhzVUCUxwxRmKzEhcbUqMsh2Ubu9FZw1vPvSOUQKjNaf9lLFIpVKW3sQMR6aOgbPhwm9WR843zZRpT1jbKN7YgaGETlBJG5fdKcfifIi9WSQu9hAx6A&u=www.sportsmanias.com%2Frumors',
         'WARC-Payload-Digest': 'sha1:3I42H3S6NNFQ2MSVX7XZKYAYSCX5QBYJ',
         'WARC-Block-Digest': 'sha1:UHJK3TXZIQRATBF4CIGW33NQ4QAGTE4M' },
      content: <Buffer 48 54 54 50 2f 31 2e 31 20 32 30 30 20 4f 4b 0d 0a 53 65 72 76 65 72 3a 20 4d 69 63 72 6f 73 6f 66 74 2d 49 49 53 2f 38 2e 30 0d 0a 70 33 70 3a 20 43 50 ...> }
      */
  });
```
