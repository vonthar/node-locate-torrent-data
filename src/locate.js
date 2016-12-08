"use strict";

var fs = require("fs");
var path = require("path");
var util = require("../lib/util.js");
var EventEmitter = require("events").EventEmitter;
var async = require("async");
var walkDir = require("walkdir");
var getPrivate = require("private").makeAccessor();
var parseTorrentFile = require("parse-torrent-file");
var sha1 = require("simple-sha1");
var isStream = require("isstream");
var cartesianProduct = require("cartesian");
/**
 * @module locate-torrent-data
 * @example
 * ```js
 * var locateTorrentData = require("locate-torrent-data");
 * var fileIndex = locateTorrentData.index("D:\\Files");
 * var torrentPath = "C:\\Torrents\\memes.torrent";
 * fileIndex.search(torrentPath, function (error, files) {
 *   var found = files.reduce(function (count, file) {
 *     if (file.location) {
 *       return count + 1;
 *     }
 *     return count;
 *   }, 0);
 *   console.log("Files found: " + found + " / " + files.length);
 * });
 * ```
 *//**
 * @function index
 * @memberof module:locate-torrent-data
 * @param {(string|Array.<string>)} path
 * @param {Object=} options
 * @param {number=} options.maxdepth
 * @param {boolean=} options.dereference
 * @param {function=} callback
 * @param {Error} callback.error
 * @emits FileIndex#error
 * @emits FileIndex#update
 * @returns {FileIndex}
 * @description
 * Create a searchable file index from the contents of specified folder(s).
 * @example
 * ```js
 * var fileIndex = locateTorrentData.index("D:\\Files");
 * ```
 *//**
 * @function load
 * @memberof module:locate-torrent-data
 * @param {(string|Readable)} source
 * @param {function=} callback
 * @param {Error} callback.error
 * @emits FileIndex#error
 * @emits FileIndex#update
 * @returns {FileIndex}
 * @see {@link FileIndex#save}
 * @description
 * Import a file index from disk or read from specified stream.
 * @example
 * ```js
 * var fileIndex = locateTorrentData.load("~/fileindex.csv");
 * ```
 */
Object.defineProperties(module.exports, {
  index: {
    value: function (pathList, options, callback) {
      var fileIndex = createFileIndex();
      fileIndex.add(pathList, options, callback);
      return fileIndex;
    }
  },
  load: {
    value: function (source, callback) {
      var fileIndex = createFileIndex();
      var _fileIndex = getPrivate(fileIndex);
      if (typeof callback !== "function") {
        callback = function (error) {
          if (error) {
            _fileIndex.emitter.emit("error", error);
            return;
          }
          _fileIndex.emitter.emit("update");
        };
      }
      _fileIndex.queue.push({
        action: "load",
        source: source
      }, callback);
      return fileIndex;
    }
  }
});


/**
 * @class FileIndex
 * @global
 *//**
 * @event error
 * @memberof FileIndex#
 * @param {Error} error
 * @see {@link FileIndex#on}
 *//**
 * @event match
 * @memberof FileIndex#
 * @param {TorrentFile} file
 * @param {external:ParsedTorrent} torrent
 * @see {@link FileIndex#on}
 *//**
 * @event notFound
 * @memberof FileIndex#
 * @param {TorrentFile} file
 * @param {external:ParsedTorrent} torrent
 * @see {@link FileIndex#on}
 *//**
 * @event end
 * @memberof FileIndex#
 * @param {Array.<TorrentFile>} files
 * @param {external:ParsedTorrent} torrent
 * @see {@link FileIndex#on}
 *//**
 * @event update
 * @memberof FileIndex#
 * @see {@link FileIndex#on}
 *//**
 * @function search
 * @memberof FileIndex#
 * @param {(string|external:ParsedTorrent)} torrent
 * @param {function=} forEach
 * @param {TorrentFile} forEach.file
 * @param {function} forEach.callback
 * @param {function=} callback
 * @param {Error} callback.error
 * @param {Array.<TorrentFile>} callback.files
 * @emits FileIndex#error
 * @emits FileIndex#match
 * @emits FileIndex#notFound
 * @emits FileIndex#end
 * @emits FileIndex#update
 * @chainable
 * @description
 * Search file index for files that match the contents of specified torrent.
 * @example
 * ```js
 * var torrentPath = "C:\\Torrents\\memes.torrent";
 * var savePath = "D:\\Seeding";
 * var torrent = parseTorrentFile(fs.readFileSync(torrentPath));
 * fileIndex.search(torrent, function (file, callback) {
 *   var dest = path.join(savePath, torrent.name, file.path);
 *   fs.rename(file.location, dest, callback);
 * }, function (error, files) {
 *   if (error) {
 *     console.error(error);
 *     return;
 *   }
 *   fs.unlinkSync(torrentPath);
 * });
 * ```
 *//**
 * @function on
 * @memberof FileIndex#
 * @param {string} event
 * @param {function} callback
 * @chainable
 * @description
 * Add event listener.
 * @example
 * ```js
 * fileIndex
 *   .on("error", function (error) {
 *     console.error(error);
 *   })
 *   .on("match", function (file, torrent) {
 *     var dest = path.join("D:\\Seeding", torrent.name, file.path);
 *     fs.rename(file.location, dest, function () {
 *       console.log("File located and moved: " + file.name);
 *     });
 *   })
 *   .on("notFound", function (file, torrent) {
 *     console.log("File not found: " + file.name);
 *   })
 *   .on("end", function (files, torrent) {
 *     var found = files.reduce(function (count, file) {
 *       if (file.location) {
 *         return count + 1;
 *       }
 *       return count;
 *     }, 0);
 *     console.log("Files found: " + found + " / " + files.length);
 *   })
 *   .on("update", function () {
 *     console.log("File index updated.");
 *   });
 * var torrentPath = "C:\\Torrents";
 * fs.readdirSync(torrentPath).forEach(function (file) {
 *   if (file.endsWith(".torrent")) {
 *     fileIndex.search(path.join(torrentPath, file));
 *   }
 * });
 * ```
 *//**
 * @function add
 * @memberof FileIndex#
 * @param {(string|Array.<string>)} path
 * @param {Object=} options
 * @param {number=} options.maxdepth
 * @param {boolean=} options.dereference
 * @param {function=} callback
 * @param {Error} callback.error
 * @emits FileIndex#error
 * @emits FileIndex#update
 * @chainable
 * @description
 * Add contents of specified folder(s) to the file index.
 * @example
 * ```js
 * var fileIndex = locateTorrentData.index("D:\\Files");
 * fileIndex.add("D:\\Files2");
 * ```
 *//**
 * @function remove
 * @memberof FileIndex#
 * @param {(string|Array.<string>)} path
 * @param {function=} callback
 * @emits FileIndex#update
 * @chainable
 * @description
 * Remove contents of specified folder(s) from the file index.
 * @example
 * ```js
 * var fileIndex = locateTorrentData.index("D:\\Files");
 * fileIndex.remove("D:\\Files\\Secret Files");
 * ```
 *//**
 * @function save
 * @memberof FileIndex#
 * @param {(string|Writable)} destination
 * @param {function=} callback
 * @param {Error} callback.error
 * @emits FileIndex#error
 * @chainable
 * @see {@link module:locate-torrent-data.load}
 * @description
 * Export file index as csv file to disk at specified path or write to specified stream.
 * @example
 * ```js
 * fileIndex.save("~/fileindex.csv");
 * ```
 */
var FileIndex = Object.create(Object.prototype, {
  search: {
    value: function (torrent, forEach, callback) {
      var self = getPrivate(this);
      if (typeof callback !== "function") {
        callback = forEach;
        forEach = null;
      }
      var parsedTorrent;
      if (typeof callback !== "function") {
        callback = function (error, files) {
          if (error) {
            self.emitter.emit("error", error);
            return;
          }
          for (var i = 0; i < files.length; i++) {
            if (!files[i].location) {
              self.emitter.emit("notFound", files[i], parsedTorrent);
            }
          }
          self.emitter.emit("end", files, parsedTorrent);
        };
      }
      try {
        switch (typeof torrent) {
          case "string":
            parsedTorrent = parseTorrentFile(fs.readFileSync(torrent));
            break;
          case "object":
            if (torrent.files && torrent.pieces && torrent.pieceLength) {
              parsedTorrent = torrent;
            }
            else {
              parsedTorrent = parseTorrentFile(torrent);
            }
            break;
          default:
            throw new Error("Invalid torrent.");
        }
      }
      catch (error) {
        callback(error);
        return;
      }
      self.queue.push({
        action: "search",
        parsedTorrent: parsedTorrent,
        forEach: forEach
      }, callback);
      return this;
    }
  },
  on: {
    value: function (event, callback) {
      var self = getPrivate(this);
      self.emitter.on(event, callback);
      return this;
    }
  },
  add: {
    value: function (pathList, options, callback) {
      var self = getPrivate(this);
      if (typeof options === "function") {
        callback = options;
        options = null;
      }
      if (typeof callback !== "function") {
        callback = function (error) {
          if (error) {
            self.emitter.emit("error", error);
            return;
          }
          self.emitter.emit("update");
        };
      }
      self.queue.push({
        action: "add",
        pathList: [].concat(pathList),
        options: options
      }, callback);
      return this;
    }
  },
  remove: {
    value: function (pathList, callback) {
      var self = getPrivate(this);
      if (typeof callback !== "function") {
        callback = function () {
          self.emitter.emit("update");
        };
      }
      self.queue.push({
        action: "remove",
        pathList: pathList,
      }, callback);
      return this;
    }
  },
  save: {
    value: function (destination, callback) {
      var self = getPrivate(this);
      if (typeof callback !== "function") {
        callback = function (error) {
          if (error) {
            self.emitter.emit("error", error);
            return;
          }
        };
      }
      self.queue.push({
        action: "save",
        destination: destination
      }, callback);
      return this;
    }
  }
});


/**
 * @class TorrentFile
 * @global
 * @property {number} offset - Offset of file inside torrent.
 * @property {number} length - File size in bytes.
 * @property {string} name - File name inside torrent.
 * @property {string} path - Path of file inside torrent.
 * @property {string} location - Location on disk of matching file if found.
 */
/**
 * A torrent piece to be checked for file matches
 * @typedef {Object} TorrentPiece
 * @private
 * @property {number} offset
 * @property {number} length
 * @property {number} index
 * @property {string} hash
 * @property {Array.<FileChunk>} chunkList
 * @property {Array.<MatchItem>} sizeMatches
 * @property {TorrentPiece=} previousPiece
 */
/**
 * A file chunk that falls within a single TorrentPiece
 * @typedef {Object} FileChunk
 * @private
 * @property {number} offset
 * @property {number} length
 * @property {number} position
 * @property {TorrentFile} file
 */
/**
 * A file that possibly matches a FileChunk
 * @typedef {Object} MatchItem
 * @private
 * @property {number} chunkIndex
 * @property {string} path
 * @property {Buffer=} buffer
 */
/**
 * @external ParsedTorrent
 * @property {number} pieceLength
 * @property {Array.<TorrentFile>} files
 * @property {Array.<string>} pieces
 * @see {@link https://www.npmjs.com/package/parse-torrent-file}
 */


function createFileIndex() {
  var fileIndex = Object.create(FileIndex);
  var _fileIndex = getPrivate(fileIndex);
  _fileIndex.emitter = new EventEmitter();
  _fileIndex.queue = async.queue(function (task, done) {
    processTask(_fileIndex, task, done);
  }, 5);
  return fileIndex;
}


/**
 * @private
 * @param {FileIndex} self
 * @param {Object} task
 * @param {function} callback
 * @param {Error} callback.error
 * @param {Array.<TorrentFile>} callback.files
 */
function processTask(self, task, callback) {
  switch (task.action) {
    case "search":
      locateFiles(self.fileTable, task.parsedTorrent, function (file, done) {
        if (task.forEach) {
          task.forEach(file, function () {
            if (!fs.existsSync(file.location)) {
              self.fileTable.remove(file.location);
            }
            done();
          });
          return;
        }
        self.emitter.emit("match", file, task.parsedTorrent);
        done();
      }, callback);
      return;
    case "save":
      exportFileTable(self.fileTable, task.destination, callback);
      return;
    case "load":
      self.queue.pause();
      importFileTable(task.source, function (error, fileTable) {
        if (error) {
          self.queue.kill();
          callback(error);
          return;
        }
        self.fileTable = fileTable;
        self.queue.resume();
        callback(null);
      });
      return;
    case "add":
    case "remove":
      self.queue.pause();
      if (self.fileTable) {
        var pathList = task.pathList.map(function (item) {
          return path.resolve(item) + path.sep;
        });
        self.fileTable = self.fileTable.filter(function (size, location) {
          return !pathList.some(function (value) {
            return location.startsWith(value);
          });
        });
      }
      if (task.action === "remove") {
        self.queue.resume();
        callback();
        return;
      }
      buildFileTable(task.pathList, task.options, function (error, fileTable) {
        if (error) {
          self.queue.resume();
          callback(error);
          return;
        }
        if (self.fileTable) {
          self.fileTable.merge(fileTable);
        }
        else {
          self.fileTable = fileTable;
        }
        self.queue.resume();
        callback(null);
      });
      return;
    default:
  }
}


/**
 * @private
 * @param {Array.<string>} pathList
 * @param {Object=} options
 * @param {number} options.maxdepth
 * @param {boolean} options.dereference
 * @param {function} callback
 * @param {Error} callback.error
 * @param {FileTable=} callback.fileTable
 */
function buildFileTable(pathList, options, callback) {
  if (!options) {
    options = {};
  }
  var config = {};
  config["max_depth"] = options.maxdepth;
  config["follow_symlinks"] = options.dereference;
  async.map(pathList, function (dirPath, done) {
    var fileTable = util.createFileTable();
    var filesStream = walkDir(dirPath, config);
    var error = null;
    filesStream.on("error", function (errorPath) {
      error = new Error("Failed to read path: " + errorPath);
      filesStream.end();
    });
    filesStream.on("file", function (filePath, stats) {
      fileTable.put(stats.size, filePath);
    });
    filesStream.on("end", function () {
      done(error, fileTable);
    });
  }, function (error, results) {
    if (error) {
      callback(error);
      return;
    }
    var fileTable = results[0];
    for (var i = 1; i < results.length; i++) {
      fileTable.merge(results[i]);
    }
    callback(null, fileTable);
  });
}


/**
 * @private
 * @param {(string|Readable)} source
 * @param {function} callback
 * @param {Error} callback.error
 * @param {FileTable=} callback.fileTable
 */
function importFileTable(source, callback) {
  var fileTable = util.createFileTable();
  var readStream;
  if (isStream.isReadable(source)) {
    readStream = source;
  }
  else {
    readStream = fs.createReadStream(source, {
      flags: "r",
      encoding: "utf8",
      autoClose: true
    });
  }
  readStream.on("error", callback);
  var format = /^(\d+),"(.+)"$/;
  var lineReader = require("readline").createInterface({
    input: readStream,
    output: null,
    terminal: false
  });
  lineReader.on("line", function (line) {
    var matches = format.exec(line);
    fileTable.put(parseInt(matches[1], 10), matches[2]);
  });
  readStream.on("end", function () {
    callback(null, fileTable);
  });
}


/**
 * @private
 * @param {FileTable} fileTable
 * @param {(string|Writable)} destination
 * @param {function} callback
 * @param {Error} callback.error
 */
function exportFileTable(fileTable, destination, callback) {
  var eol = require("os").EOL;
  var writeStream;
  if (isStream.isWritable(destination)) {
    writeStream = destination;
  }
  else {
    writeStream = fs.createWriteStream(destination, {
      flags: "w",
      defaultEncoding: "utf8",
      autoClose: true
    });
  }
  writeStream.on("error", callback);
  writeStream.on("close", callback);
  fileTable.forEach(function (size, location) {
    writeStream.write(size + ",\"" + location + "\"" + eol);
  });
  writeStream.end();
}


/**
 * Searches file table for the files referenced in torrentFile
 * @private
 * @param {FileTable} fileTable
 * @param {external:ParsedTorrent} torrent
 * @param {function} forEach
 * @param {TorrentFile} forEach.file
 * @param {function} forEach.callback
 * @param {function} callback
 * @param {Error} callback.error
 * @param {Array.<TorrentFile>} callback.files
 */
function locateFiles(fileTable, torrent, forEach, callback) {
  var previousPiece = {};
  async.eachOf(torrent.files, function (file, i, done) {
    if (!fileTable.contains(file.length)) {
      done();
      return;
    }
    var piece = getFirstPiece(torrent, i);
    if (piece.hash === previousPiece.hash) {
      done();
      return;
    }
    piece = addChunkData(piece, torrent.files, i, fileTable);
    if (piece.fallback) {
      if (piece.fallback.hash === previousPiece.hash) {
        piece.fallback = null;
      }
      else {
        piece.fallback = addChunkData(piece.fallback, torrent.files, i, fileTable);
      }
    }
    if (piece) {
      previousPiece = piece;
      checkTorrentPiece(piece, function (error, files) {
        if (error) {
          done(error);
          return;
        }
        async.each(files, forEach, done);
      });
    }
  }, function (error) {
    callback(error, torrent.files);
  });
}


/**
 * Finds the first TorrentPiece from a file
 * @private
 * @param {external:ParsedTorrent} torrent
 * @param {number} fileIndex
 * @return {TorrentPiece} A torrent piece by which file can be identified
 */
function getFirstPiece(torrent, fileIndex) {
  var file = torrent.files[fileIndex];
  var piece = {};
  piece.length = torrent.pieceLength;
  var offset = file.offset % piece.length;
  piece.offset = offset ? file.offset - offset + piece.length : file.offset;
  if (piece.offset >= file.offset + file.length) {
    piece.offset -= piece.length;
  }
  else if (piece.offset + piece.length > file.offset + file.length) {
    piece.fallback = {
      offset: piece.offset - piece.length,
      length: piece.length,
      index: (piece.offset / piece.length) - 1,
      hash: torrent.pieces[(piece.offset / torrent.pieceLength) - 1]
    };
  }
  piece.index = piece.offset / piece.length;
  if (piece.index === torrent.pieces.length - 1) {
    piece.length = torrent.lastPieceLength;
  }
  piece.hash = torrent.pieces[piece.index];
  return piece;
}


/**
 * Adds chunk data to a TorrentPiece
 * @private
 * @param {TorrentPiece} piece
 * @param {Array.<TorrentFile>} files
 * @param {number} fileIndex
 * @param {FileTable} fileTable
 * @return {TorrentPiece} The piece with added chunk data
 */
function addChunkData(piece, files, fileIndex, fileTable) {
  var firstChunk = fileIndex;
  while (firstChunk > 0) {
    if (files[firstChunk].offset <= piece.offset) {
      break;
    }
    firstChunk--;
  }
  var lastChunk = fileIndex;
  var chunkOffset;
  while (lastChunk < files.length - 1) {
    chunkOffset = files[lastChunk].offset + files[lastChunk].length;
    if (chunkOffset >= piece.offset + piece.length) {
      break;
    }
    lastChunk++;
  }
  
  var sizeMatches = [];
  var chunkList = [];
  var noMatches;
  var file;
  var findMatches = function (size, location) {
    if (size === file.length) {
      noMatches = false;
      sizeMatches.push({
        chunkIndex: chunkList.length,
        path: location
      });
    }
  };
  for (var i = firstChunk; i <= lastChunk; i++) {
    file = files[i];
    noMatches = true;
    fileTable.forEach(findMatches);
    if (noMatches) {
      continue;
    }
    var chunk = {};
    chunk.file = file;
    chunk.position = Math.max(piece.offset - file.offset, 0);
    chunk.offset = Math.max(file.offset - piece.offset, 0);
    chunk.length = Math.min(file.length - chunk.position, piece.length - chunk.offset);
    chunkList.push(chunk);
  }
  piece.chunkList = chunkList;
  piece.sizeMatches = sizeMatches;
  return piece;
}


/**
 * Checks a TorrentPiece for possible file matches
 * @private
 * @param {TorrentPiece} piece
 * @param {function} callback
 * @param {Error} callback.error
 * @param {Array.<TorrentFile>} callback.files
 */
function checkTorrentPiece(piece, callback) {
  var matrix = [];
  async.forEachOf(piece.sizeMatches, function readChunk(match, i, done) {
    fs.open(match.path, "r", function openFile(error, fd) {
      if (error) {
        done(error);
        return;
      }
      if (matrix[match.chunkIndex]) {
        matrix[match.chunkIndex].push(i);
      }
      else {
        matrix[match.chunkIndex] = [ i ];
      }
      var chunk = piece.chunkList[match.chunkIndex];
      match.buffer = Buffer.alloc ? Buffer.alloc(chunk.length) : new Buffer(chunk.length);
      fs.read(fd, match.buffer, 0, chunk.length, chunk.position, done);
    });
  }, function testMatches(error) {
    if (error) {
      callback(error);
      return;
    }
    async.detect(cartesianProduct(matrix), function testCombo(combo, done) {
      var buffer = Buffer.alloc ? Buffer.alloc(piece.length) : new Buffer(piece.length);
      for (var i = 0; i < combo.length; i++) {
        var chunk = piece.chunkList[i];
        var match = piece.sizeMatches[combo[i]];
        match.buffer.copy(buffer, chunk.offset, 0, chunk.length);
      }
      sha1(buffer, function testHash(hash) {
        done(null, hash === piece.hash);
      });
    }, function returnResult(error, result) {
      var files;
      var location;
      if (result) {
        files = [];
        piece.chunkList.forEach(function (chunk, i) {
          location = piece.sizeMatches[result[i]].path;
          if (!chunk.file.location) {
            chunk.file.location = location;
            files.push(chunk.file);
          }
          else if (chunk.file.location !== location) {
            throw new Error("woops, same file different results");
          }
        });
        callback(error, files);
        return;
      }
      if (piece.fallback) {
        checkTorrentPiece(piece.fallback, callback);
        return;
      }
      callback(error);
    });
  });
}

