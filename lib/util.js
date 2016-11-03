module.exports.hashTableUnion = function (table1, table2) {
  if (!table1) {
    return table2;
  }
  if (!table2) {
    return table1;
  }
  var isCollision;
  table2.forEach(function (item2) {
    isCollision = table1.some(function (item1) {
      return item1.value === item2.value;
    });
    if (!isCollision) {
      table1.put(item2.key, item2.value);
    }
  });
  return table1;
};

