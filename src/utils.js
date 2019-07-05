module.exports.bin2String = function (array) {
  if (typeof array == typeof "str") return array;
  return String.fromCharCode.apply(String, array);
}