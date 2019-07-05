const fs = require('fs');
const path = require('path');
const read = require('fs-readdir-recursive');

const icons = require('../config/icons.json');

module.exports.getBlocklyXml = function (id) {
  if (!fs.existsSync(path.join(__dirname, "/../data"))) {
    fs.mkdirSync(path.join(__dirname + "/../data"));
  }
  if (!fs.existsSync(path.join(__dirname, "/../data/", id))) {
    fs.mkdirSync(path.join(__dirname, "/../data/", id));
  }
  if (!fs.existsSync(path.join(__dirname, "/../data/", id, "/blockly.xml"))) {
    return '';
  }
  return fs.readFileSync(path.join(__dirname, "/../data/", id, "/blockly.xml"));
}

module.exports.getExampleXml = function () {
  return fs.readFileSync(path.join(__dirname, "/../config/example.xml"));
}

module.exports.generateXmlTreeRecursively = function (categories) {
  var result = "";
  for (var c of categories) {
    result += "<category name='" + c.name.replace(/_/g, "") + "' colour='" + c.color + "'>";
    result += this.generateXmlTreeRecursively(c.subcategories);
    for (var b of c.blocks) {
      result += "<block type='" + b + "'></block>";
    }
    result += "</category>"
  }
  return result;
}

module.exports.initializeBlocksRecursively = function (p, categories) {
  var blocks = [];
  var max = {};
  var restrictions = {};
  var generators = [];

  var files = read(p).filter(f => f.endsWith(".json"));

  for (var f of files) {
    if (f.startsWith("/") || f.startsWith("\\")) f = f.substring(1);
    if (f.endsWith("/") || f.endsWith("\\")) f.substr(0, f.length - 1);

    var json = JSON.parse(fs.readFileSync(path.join("./blocks/", f)));
    var splits = f.split(/[\/\\]+/g);
    splits.pop();

    if (json.icons) {
      var _icons = json.icons.reverse();
      for (var icon of _icons) {
        if (!json.block.args0) json.block.args0 = [];

        json.block.args0.unshift({
          "type": "field_image",
          "src": icons[icon],
          "width": 15,
          "height": 15,
          "alt": icon,
          "flipRtl": false
        });

        json.block.message0 = this.bumpMessageNumbers(json.block.message0);
      }
    }

    blocks.push(json.block);

    if (json.max) max[json.block.type] = json.max;

    if (json.restrictions) restrictions[json.block.type] = json.restrictions;

    var desiredCategoryName = splits.pop();
    var desiredCategory = this.findCategoryRecursively(categories, desiredCategoryName);
    if (desiredCategory) desiredCategory.blocks.push(json.block.type);

    if (json.generator) {
      generators.push({
        type: json.block.type,
        generator: json.generator
      });
    }
  }

  return {
    blocks: blocks,
    max: max,
    restrictions: restrictions,
    generators: generators
  };
}

module.exports.findCategoryRecursively = function (categories, cat) {
  for (var c of categories) {
    if (c.name == cat) return c;

    var subcat = this.findCategoryRecursively(c.subcategories, cat);
    if (subcat) return subcat;
  }
}

module.exports.initializeCategoriesRecursively = function (p) {
  var isDirectory = source => fs.lstatSync(source).isDirectory();
  var dirs = fs.readdirSync(p).map(name => path.join(p, name)).filter(isDirectory);

  var result = [];
  for (var dir of dirs) {
    result.push({
      name: dir.split(/[\/\\]+/g).pop(),
      color: Number.parseInt(fs.readFileSync(path.join(dir, "/.color"))),
      subcategories: this.initializeCategoriesRecursively(dir),
      blocks: [],
    });
  }

  return result;
}

module.exports.bumpMessageNumbers = function (message) {
  var str = "%0 " + message;
  var nr = str.match(/%\d+/g).length;

  for (var i = nr - 1; i >= 0; i--) {
    str = str.replace("%" + i, "%" + Number.parseInt(i + 1));
  }

  return str;
}