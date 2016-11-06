var FileTable = {};
Object.defineProperties(FileTable, {
  put: {
    value: function (size, location) {
      this.sizeList.push(size);
      this.pathList.push(location);
      return this;
    }
  },
  contains: {
    value: function (size) {
      return this.sizeList.some(function (value) {
        return value === size;
      });
    }
  },
  get: {
    value: function (size) {
      var pathList = this.pathList;
      return this.sizeList.map(function (value, i) {
        if (value === size) {
          return pathList[i];
        }
      });
    }
  },
  merge: {
    value: function (table) {
      var self = this;
      table.pathList.forEach(function (value, i) {
        if (self.pathList.indexOf(value) === -1) {
          self.put(table.sizeList[i], value);
        }
      });
      return self;
    }
  },
  remove: {
    value: function (location) {
      var i = this.pathList.indexOf(location);
      if (i !== -1) {
        this.sizeList.splice(i, 1);
        this.pathList.splice(i, 1);
      }
      return this;
    }
  },
  forEach: {
    value: function (callback) {
      var pathList = this.pathList;
      this.sizeList.forEach(function (value, i) {
        callback(value, pathList[i]);
      });
      return this;
    }
  },
  filter: {
    value: function (callback) {
      var table = module.exports.createFileTable();
      var pathList = this.pathList;
      this.sizeList.forEach(function (value, i) {
        if (callback(value, pathList[i])) {
          table.put(value, pathList[i]);
        }
      });
      return table;
    }
  }
});

module.exports.createFileTable = function () {
  var table = Object.create(FileTable);
  table.sizeList = [];
  table.pathList = [];
  return table;
};
