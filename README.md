node-locate-torrent-data
==========================================================================================
[![NPM Package](https://img.shields.io/npm/v/locate-torrent-data.svg)](https://www.npmjs.org/package/locate-torrent-data)
[![Build Status](https://travis-ci.org/vonthar/node-locate-torrent-data.svg?branch=master)](https://travis-ci.org/vonthar/node-locate-torrent-data/branches)
[![Coverage Status](https://coveralls.io/repos/github/vonthar/node-locate-torrent-data/badge.svg?branch=master)](https://coveralls.io/github/vonthar/node-locate-torrent-data?branch=master)
[![Dependency Status](https://david-dm.org/vonthar/node-locate-torrent-data.svg)](https://david-dm.org/vonthar/node-locate-torrent-data)

**Example**  
```js
var locateTorrentData = require("locate-torrent-data");
var fileIndex = locateTorrentData.index("D:\\Files");
var torrentPath = "C:\\Torrents\\memes.torrent";
fileIndex.search(torrentPath, function (error, files) {
  var found = files.reduce(function (count, file) {
    if (file.location) {
      return count + 1;
    }
    return count;
  }, 0);
  console.log("Files found: " + found + " / " + files.length);
});
```
 
Installation
------------
`npm i locate-torrent-data`


API Reference
-------------

* [locate-torrent-data](#module_locate-torrent-data)
    * [.index(path, [options], [callback])](#module_locate-torrent-data.index) ⇒ <code>[FileIndex](#FileIndex)</code>
    * [.load(source, [callback])](#module_locate-torrent-data.load) ⇒ <code>[FileIndex](#FileIndex)</code>

<a name="module_locate-torrent-data.index"></a>

### locate-torrent-data.index(path, [options], [callback]) ⇒ <code>[FileIndex](#FileIndex)</code>
Create a searchable file index from the contents of specified folder(s).

**Kind**: static method of <code>[locate-torrent-data](#module_locate-torrent-data)</code>  
**Chainable**  
**Emits**: <code>[error](#FileIndex+event_error)</code>, <code>[update](#FileIndex+event_update)</code>  
**Params**

- path <code>string</code> | <code>Array.&lt;string&gt;</code>
- [options] <code>Object</code>
    - [.maxdepth] <code>number</code>
    - [.dereference] <code>boolean</code>
- [callback] <code>function</code>
    - .error <code>Error</code>
    - .fileIndex <code>[FileIndex](#FileIndex)</code>

**Example**  
```js
var fileIndex = locateTorrentData.index("D:\\Files");
```
 
<a name="module_locate-torrent-data.load"></a>

### locate-torrent-data.load(source, [callback]) ⇒ <code>[FileIndex](#FileIndex)</code>
Import a file index from disk or read from specified stream.

**Kind**: static method of <code>[locate-torrent-data](#module_locate-torrent-data)</code>  
**Chainable**  
**Emits**: <code>[error](#FileIndex+event_error)</code>, <code>[update](#FileIndex+event_update)</code>  
**See**: [save](#FileIndex+save)  
**Params**

- source <code>string</code> | <code>Readable</code>
- [callback] <code>function</code>
    - .error <code>Error</code>
    - .fileIndex <code>[FileIndex](#FileIndex)</code>

**Example**  
```js
var fileIndex = locateTorrentData.load("~/fileindex.csv");
```
<a name="FileIndex"></a>

## FileIndex
**Kind**: global class  

* [FileIndex](#FileIndex)
    * _function_
        * [.search(torrent, [forEach], [callback])](#FileIndex+search) ⇒ <code>[FileIndex](#FileIndex)</code>
        * [.on(event, callback)](#FileIndex+on) ⇒ <code>[FileIndex](#FileIndex)</code>
        * [.add(path, [options], [callback])](#FileIndex+add) ⇒ <code>[FileIndex](#FileIndex)</code>
        * [.remove(path, [callback])](#FileIndex+remove) ⇒ <code>[FileIndex](#FileIndex)</code>
        * [.save(destination, [callback])](#FileIndex+save) ⇒ <code>[FileIndex](#FileIndex)</code>
    * _event_
        * ["error" (error)](#FileIndex+event_error)
        * ["match" (file, torrent)](#FileIndex+event_match)
        * ["notFound" (file, torrent)](#FileIndex+event_notFound)
        * ["end" (files, torrent)](#FileIndex+event_end)
        * ["update"](#FileIndex+event_update)

<a name="FileIndex+search"></a>

### fileIndex.search(torrent, [forEach], [callback]) ⇒ <code>[FileIndex](#FileIndex)</code>
Search file index for files that match the contents of specified torrent.

**Kind**: instance method of <code>[FileIndex](#FileIndex)</code>  
**Chainable**  
**Emits**: <code>[error](#FileIndex+event_error)</code>, <code>[match](#FileIndex+event_match)</code>, <code>[notFound](#FileIndex+event_notFound)</code>, <code>[end](#FileIndex+event_end)</code>, <code>[update](#FileIndex+event_update)</code>  
**Params**

- torrent <code>string</code> | <code>[ParsedTorrent](https://www.npmjs.com/package/parse-torrent-file)</code>
- [forEach] <code>function</code>
    - .file <code>[TorrentFile](#TorrentFile)</code>
    - .callback <code>function</code>
- [callback] <code>function</code>
    - .error <code>Error</code>
    - .files <code>[Array.&lt;TorrentFile&gt;](#TorrentFile)</code>

**Example**  
```js
var torrentPath = "C:\\Torrents\\memes.torrent";
var savePath = "D:\\Seeding";
var torrent = parseTorrentFile(fs.readFileSync(torrentPath));
fileIndex.search(torrent, function (file, callback) {
  var dest = path.join(savePath, torrent.name, file.path);
  fs.rename(file.location, dest, callback);
}, function (error, files) {
  if (error) {
    console.error(error);
    return;
  }
  fs.unlinkSync(torrentPath);
});
```
 
<a name="FileIndex+on"></a>

### fileIndex.on(event, callback) ⇒ <code>[FileIndex](#FileIndex)</code>
Add event listener.

**Kind**: instance method of <code>[FileIndex](#FileIndex)</code>  
**Chainable**  
**Params**

- event <code>string</code>
- callback <code>function</code>

**Example**  
```js
fileIndex
  .on("error", function (error) {
    console.error(error);
  })
  .on("match", function (file, torrent) {
    var dest = path.join("D:\\Seeding", torrent.name, file.path);
    fs.rename(file.location, dest, function () {
      console.log("File located and moved: " + file.name);
    });
  })
  .on("notFound", function (file, torrent) {
    console.log("File not found: " + file.name);
  })
  .on("end", function (files, torrent) {
    var found = files.reduce(function (count, file) {
      if (file.location) {
        return count + 1;
      }
      return count;
    }, 0);
    console.log("Files found: " + found + " / " + files.length);
  })
  .on("update", function () {
    console.log("File index updated.");
  });
var torrentPath = "C:\\Torrents";
fs.readdirSync(torrentPath).forEach(function (file) {
  if (file.endsWith(".torrent")) {
    fileIndex.search(path.join(torrentPath, file));
  }
});
```
 
<a name="FileIndex+add"></a>

### fileIndex.add(path, [options], [callback]) ⇒ <code>[FileIndex](#FileIndex)</code>
Add contents of specified folder(s) to the file index.

**Kind**: instance method of <code>[FileIndex](#FileIndex)</code>  
**Chainable**  
**Emits**: <code>[error](#FileIndex+event_error)</code>, <code>[update](#FileIndex+event_update)</code>  
**Params**

- path <code>string</code> | <code>Array.&lt;string&gt;</code>
- [options] <code>Object</code>
    - [.maxdepth] <code>number</code>
    - [.dereference] <code>boolean</code>
- [callback] <code>function</code>
    - .error <code>Error</code>

**Example**  
```js
var fileIndex = locateTorrentData.index("D:\\Files");
fileIndex.add("D:\\Files2");
```
 
<a name="FileIndex+remove"></a>

### fileIndex.remove(path, [callback]) ⇒ <code>[FileIndex](#FileIndex)</code>
Remove contents of specified folder(s) from the file index.

**Kind**: instance method of <code>[FileIndex](#FileIndex)</code>  
**Chainable**  
**Emits**: <code>[update](#FileIndex+event_update)</code>  
**Params**

- path <code>string</code> | <code>Array.&lt;string&gt;</code>
- [callback] <code>function</code>

**Example**  
```js
var fileIndex = locateTorrentData.index("D:\\Files");
fileIndex.remove("D:\\Files\\Secret Files");
```
 
<a name="FileIndex+save"></a>

### fileIndex.save(destination, [callback]) ⇒ <code>[FileIndex](#FileIndex)</code>
Export file index as csv file to disk at specified path or write to specified stream.

**Kind**: instance method of <code>[FileIndex](#FileIndex)</code>  
**Chainable**  
**Emits**: <code>[error](#FileIndex+event_error)</code>  
**See**: [load](#module_locate-torrent-data.load)  
**Params**

- destination <code>string</code> | <code>Writable</code>
- [callback] <code>function</code>
    - .error <code>Error</code>

**Example**  
```js
fileIndex.save("~/fileindex.csv");
```
<a name="FileIndex+event_error"></a>

### "error" (error)
**Kind**: event emitted by <code>[FileIndex](#FileIndex)</code>  
**See**: [on](#FileIndex+on)  
**Params**

- error <code>Error</code>

<a name="FileIndex+event_match"></a>

### "match" (file, torrent)
**Kind**: event emitted by <code>[FileIndex](#FileIndex)</code>  
**See**: [on](#FileIndex+on)  
**Params**

- file <code>[TorrentFile](#TorrentFile)</code>
- torrent <code>[ParsedTorrent](https://www.npmjs.com/package/parse-torrent-file)</code>

<a name="FileIndex+event_notFound"></a>

### "notFound" (file, torrent)
**Kind**: event emitted by <code>[FileIndex](#FileIndex)</code>  
**See**: [on](#FileIndex+on)  
**Params**

- file <code>[TorrentFile](#TorrentFile)</code>
- torrent <code>[ParsedTorrent](https://www.npmjs.com/package/parse-torrent-file)</code>

<a name="FileIndex+event_end"></a>

### "end" (files, torrent)
**Kind**: event emitted by <code>[FileIndex](#FileIndex)</code>  
**See**: [on](#FileIndex+on)  
**Params**

- files <code>[Array.&lt;TorrentFile&gt;](#TorrentFile)</code>
- torrent <code>[ParsedTorrent](https://www.npmjs.com/package/parse-torrent-file)</code>

<a name="FileIndex+event_update"></a>

### "update"
**Kind**: event emitted by <code>[FileIndex](#FileIndex)</code>  
**See**: [on](#FileIndex+on)  
<a name="TorrentFile"></a>

## TorrentFile
**Kind**: global class  
**Properties**

- offset <code>number</code> - Offset of file inside torrent.  
- length <code>number</code> - File size in bytes.  
- name <code>string</code> - File name inside torrent.  
- path <code>string</code> - Path of file inside torrent.  
- location <code>string</code> - Location on disk of matching file if found.  



License
-------
MPL 2.0
