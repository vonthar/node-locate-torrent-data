var fs = require("fs-extra");
var path = require("path");
var tape = require("tape");
var randomString = require("random-string");
var createTorrent = require("create-torrent");
var parseTorrentFile = require("parse-torrent-file");
var locateTorrentData = require("..");


var parsedTorrent;
tape("create fixtures", function (assert) {
  var base = path.join(__dirname, "fixtures");
  fs.emptyDirSync(base);
  var dir = path.join(base, "torrent");
  fs.mkdirSync(dir);
  process.chdir(dir);
  fs.writeFileSync("file1.txt", randomString({ length: 200 }));
  fs.writeFileSync("file2.txt", randomString({ length: 5 }));
  fs.writeFileSync("file3.txt", randomString({ length: 1000 }));
  fs.writeFileSync("file4.txt", randomString({ length: 100 }));
  fs.writeFileSync("file5.txt", randomString({ length: 5 }));
  fs.writeFileSync("file6.txt", randomString({ length: 5 }));
  fs.writeFileSync("file7.txt", randomString({ length: 5 }));
  fs.writeFileSync("file8.txt", randomString({ length: 5 }));
  fs.writeFileSync("file9.txt", randomString({ length: 99 }));
  dir = path.join(base, "torrent", "subdir");
  fs.mkdirSync(dir);
  process.chdir(dir);
  fs.writeFileSync("file10.txt", randomString({ length: 30 }));
  fs.writeFileSync("file11.txt", randomString({ length: 30 }));
  fs.writeFileSync("file12.txt", randomString({ length: 30 }));
  dir = path.join(base, "torrent", "subdir", "subsubdir");
  fs.mkdirSync(dir);
  process.chdir(dir);
  fs.writeFileSync("file13.txt", randomString({ length: 30 }));
  dir = path.join(base, "data");
  fs.mkdirSync(dir);
  process.chdir(dir);
  fs.writeFileSync("file1.txt", randomString({ length: 200 }));
  fs.writeFileSync("file2.txt", randomString({ length: 5 }));
  fs.writeFileSync("file3.txt", randomString({ length: 1000 }));
  dir = path.join(base, "data", "subdir");
  fs.mkdirSync(dir);
  process.chdir(dir);
  fs.writeFileSync("file4.txt", randomString({ length: 100 }));
  fs.writeFileSync("file5.txt", randomString({ length: 5 }));
  fs.writeFileSync("file6.txt", randomString({ length: 5 }));
  dir = path.join(base, "data", "subdir2");
  fs.mkdirSync(dir);
  process.chdir(dir);
  fs.writeFileSync("file7.txt", randomString({ length: 5 }));
  fs.writeFileSync("file8.txt", randomString({ length: 5 }));
  dir = path.join(base, "data", "subdir2", "subsubdir");
  fs.mkdirSync(dir);
  process.chdir(dir);
  fs.writeFileSync("file10.txt", randomString({ length: 30 }));
  fs.writeFileSync("file11.txt", randomString({ length: 30 }));
  fs.writeFileSync("file12.txt", randomString({ length: 30 }));
  fs.writeFileSync("file13.txt", randomString({ length: 30 }));
  assert.plan(8);
  assert.equal(fs.readdirSync(path.join(base, "torrent")).length, 10);
  process.chdir(base);
  createTorrent("torrent", {
    name: "testTorrent",
    pieceLength: 30
  }, function (error, data) {
    assert.error(error);
    fs.writeFileSync("test.torrent", data);
    parsedTorrent = parseTorrentFile(fs.readFileSync("test.torrent"));
    assert.equal(parsedTorrent.name, "testTorrent");
    assert.equal(parsedTorrent.files.length, 13);
    assert.equal(parsedTorrent.length, 1544);
    assert.equal(parsedTorrent.pieceLength, 30);
    fs.renameSync("torrent/file1.txt", "data/file1.dat");
    fs.linkSync("torrent/file2.txt", "data/file2.dat");
    fs.copySync("torrent/file3.txt", "data/file3.dat");
    fs.renameSync("torrent/file4.txt", "data/file4.dat");
    assert.equal(fs.readdirSync("data").length, 9);
    fs.renameSync("torrent/subdir/file10.txt", "data/subdir2/subsubdir/file10.dat");
    fs.linkSync("torrent/subdir/file11.txt", "data/subdir2/subsubdir/file11.dat");
    fs.copySync("torrent/subdir/file12.txt", "data/subdir2/subsubdir/file12.dat");
    fs.renameSync("torrent/subdir/subsubdir/file13.txt", "data/subdir2/subsubdir/file13.dat");
    assert.equal(fs.readdirSync("data/subdir2/subsubdir").length, 8);
  });
});

tape("search incomplete index", function (assert) {
  assert.plan(17);
  var notFound = 0;
  var fileIndex = locateTorrentData.index("data");
  fileIndex.on("match", function (file) {
    assert.equal(path.basename(file.path, ".txt"), path.basename(file.location, ".dat"));
  });
  fileIndex.on("notFound", function (file) {
    assert.ok(file.path);
    notFound++;
  });
  fileIndex.on("error", function (error) {
    assert.error(error);
  });
  fileIndex.on("end", function (files, torrent) {
    assert.equal(files.length, 13);
    assert.equal(torrent.files.length, 13);
    assert.equal(notFound, 5);
  });
  fileIndex.search(fs.readFileSync("test.torrent"));
  fileIndex.save("index.csv", function (error) {
    assert.error(error);
  });
});

tape("search complete index", function (assert) {
  assert.plan(16);
  fs.linkSync("torrent/file5.txt", "data/subdir/file5.dat");
  fs.copySync("torrent/file6.txt", "data/subdir/file6.dat");
  fs.renameSync("torrent/file7.txt", "data/subdir/file7.dat");
  fs.linkSync("torrent/file8.txt", "data/subdir/file8.dat");
  var fileIndex = locateTorrentData.load("index.csv");
  fileIndex.add("data/subdir");
  fs.copySync("torrent/file9.txt", "data/subdir2/file9.dat");
  fileIndex.add("data/subdir2");
  fileIndex.search("test.torrent", function (file, callback) {
    assert.equal(path.basename(file.path, ".txt"), path.basename(file.location, ".dat"));
    callback();
  }, function (error, files) {
    assert.error(error);
    assert.equal(files.length, 13);
    fileIndex.save(fs.createWriteStream("index.csv"), function (error) {
      assert.error(error);
    });
  });
});

tape("test remove", function (assert) {
  assert.plan(3);
  var fileIndex = locateTorrentData.index("data", { maxdepth: 1 });
  fileIndex.search("test.torrent", function (error, files) {
    assert.equal(count(files), 4);
  });
  fileIndex.add([ "data/subdir", "data/subdir2" ]);
  fileIndex.search("test.torrent", function (error, files) {
    assert.equal(count(files), 13);
  });
  fileIndex.remove([ "data/subdir", "data/subdir2" ]);
  fileIndex.search("test.torrent", function (error, files) {
    assert.equal(count(files), 4);
  });
});

tape("foreach remove", function (assert) {
  assert.plan(3);
  var fileIndex = locateTorrentData.index("data");
  fileIndex.search("test.torrent", function (file, done) {
    if (file.name === "file3.txt") {
      fs.remove(file.location, done);
      assert.pass();
      return;
    }
    done();
  }, function (error, files) {
    assert.error(error);
    assert.equal(count(files), 13);
  });
});

tape("search error", function (assert) {
  assert.plan(4);
  var fileIndex = locateTorrentData.load(fs.createReadStream("index.csv"));
  fileIndex.on("error", function (error) {
    assert.ok(error);
  });
  fileIndex.search("test.torrent", function (error) {
    assert.ok(error);
  });
  fileIndex.search(parsedTorrent);
  fileIndex.search("data/file1.dat");
  fileIndex.search();
});

tape("save error", function (assert) {
  assert.plan(2);
  var fileIndex = locateTorrentData.load("index.csv");
  fs.writeFileSync("index2.csv", "", { mode: 0o555 });
  fileIndex.on("error", function (error) {
    assert.ok(error);
  });
  fileIndex.save("index2.csv", function (error) {
    assert.ok(error);
  });
  fileIndex.save("index2.csv");
});

tape("load error", function (assert) {
  assert.plan(2);
  var fileIndex = locateTorrentData.load("index3.csv");
  fileIndex.on("error", function (error) {
    assert.ok(error);
  });
  locateTorrentData.load("index4.csv", function (error) {
    assert.ok(error);
  });
});

tape("index error", function (assert) {
  assert.plan(2);
  var fileIndex = locateTorrentData.index("deleted");
  fileIndex.on("error", function (error) {
    assert.ok(error);
  });
  locateTorrentData.index("deleted", function (error) {
    assert.ok(error);
  });
});

/*tape.onFinish(function () {
  process.chdir(__dirname);
  fs.removeSync("fixtures");
});*/

function count(files) {
  return files.reduce(function (count, file) {
    if (file.location) {
      return count + 1;
    }
    return count;
  }, 0);
}

