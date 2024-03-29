const fs = require('fs');
const path = require('path');
const read = require('fs-readdir-recursive');

const icons = require('../config/icons.json');

module.exports.isConfigEmpty = function (id) {
  var config = JSON.parse(getJsonConfig(id));
  for (var key in config) {
    if (config.hasOwnProperty(key) && key != "var") return false;
  }
  return true;
}

function getJsonConfig(id) {
  if (!fs.existsSync(path.join(__dirname, "/../data"))) {
    fs.mkdirSync(path.join(__dirname + "/../data"));
  }
  if (!fs.existsSync(path.join(__dirname, "/../data/", id))) {
    fs.mkdirSync(path.join(__dirname, "/../data/", id));
  }
  if (!fs.existsSync(path.join(__dirname, "/../data/", id, "/config.json"))) {
    return '{}';
  }
  return fs.readFileSync(path.join(__dirname, "/../data/", id, "/config.json"));
}

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
    if (c.name.includes("[sep]")) {
      result += "<sep></sep>";
      continue;
    }
    result += "<category name='" + c.name.substring(4) + "' colour='" + c.color + "'";
    if (c.custom) result += " custom='" + c.custom + "'";
    result += ">";
    result += this.generateXmlTreeRecursively(c.subcategories);
    for (var b of c.blocks) {
      result += "<block type='" + b.type + "'>";
      if (b.extra) result += b.extra;
      result += "</block>";
    }
    result += "</category>"
  }
  return result;
}

module.exports.initializeAllBlocks = function (categories) {
  var defaultBlocks = initializeDefaultBlocks(path.join(__dirname, "/../blocks/default/"), categories);
  var customBlocks = initializeCustomBlocks(path.join(__dirname, "/../blocks/custom/"), categories);

  var blocks = customBlocks.blocks.concat(defaultBlocks);
  var max = customBlocks.max;
  var restrictions = customBlocks.restrictions;
  var generators = customBlocks.generators;

  max["procedures_defnoreturn"] = -1;
  max["procedures_defreturn"] = -1;
  max["procedures_ifreturn"] = -1;

  return {
    blocks,
    max,
    restrictions,
    generators,
  }
}

function initializeDefaultBlocks(p, categories) {
  var blocks = [];

  var files = read(p).filter(f => f.endsWith(".json"));

  for (var f of files) {
    if (f.startsWith("/") || f.startsWith("\\")) f = f.substring(1);
    if (f.endsWith("/") || f.endsWith("\\")) f.substr(0, f.length - 1);

    var json = JSON.parse(fs.readFileSync(path.join(p, f)));
    var splits = f.split(/[\/\\]+/g);
    splits.pop();

    json.default = true;
    blocks.push(json);

    var desiredCategoryName = splits.pop();
    var desiredCategory = findCategoryRecursively(categories, desiredCategoryName);
    if (desiredCategory) desiredCategory.blocks.push(json);
  }

  return blocks;
}

function initializeCustomBlocks(p, categories) {
  var blocks = [];
  var max = {};
  var restrictions = {};
  var generators = [];

  var files = read(p).filter(f => f.endsWith(".json"));

  for (var f of files) {
    if (f.startsWith("/") || f.startsWith("\\")) f = f.substring(1);
    if (f.endsWith("/") || f.endsWith("\\")) f.substr(0, f.length - 1);

    var json = JSON.parse(fs.readFileSync(path.join(p, f)));
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

        json.block.message0 = bumpMessageNumbers(json.block.message0);
      }
    }

    blocks.push(json.block);

    if (json.max) max[json.block.type] = json.max;

    if (json.restrictions) restrictions[json.block.type] = json.restrictions;

    var desiredCategoryName = splits.pop();
    if (desiredCategoryName.startsWith("add ")) desiredCategoryName = desiredCategoryName.substring(4);
    var desiredCategory = findCategoryRecursively(categories, desiredCategoryName);
    var obj = {
      type: json.block.type
    };
    if (json.extra) obj.extra = json.extra;
    if (desiredCategory) desiredCategory.blocks.push(obj);

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

function findCategoryRecursively(categories, cat) {
  cat = cat.replace(/\([0-9]+\)/g, "");
  cat = cat.replace(/\[[^s](.*?)\]/g, "");
  cat = cat.trim();

  for (var c of categories) {
    if (c.name == cat) return c;

    var subcat = findCategoryRecursively(c.subcategories, cat);
    if (subcat) return subcat;
  }
}

module.exports.initializeAllCategoriesRecursively = function () {
  var defaultCategories = initializeCategoriesRecursively(path.join(__dirname, "/../blocks/default/"));
  var customCategories = initializeCategoriesRecursively(path.join(__dirname, "/../blocks/custom/"));

  return defaultCategories.concat(customCategories);
}

function initializeCategoriesRecursively(p) {
  var isDirectory = source => fs.lstatSync(source).isDirectory();
  var dirs = fs.readdirSync(p).map(name => path.join(p, name)).filter(isDirectory);

  var result = [];
  for (var dir of dirs) {
    var name = dir.split(/[\/\\]+/g).pop();

    if (name.startsWith("add")) continue;

    var colorRegex = /\([0-9]+\)/g;
    var colorRegexMatches = colorRegex.exec(name);
    var color = colorRegexMatches && colorRegexMatches[0] ? colorRegexMatches[0].substring(1, colorRegexMatches[0].length - 1) : "0";
    name = name.replace(colorRegex, "");

    var customRegex = /\[[^s](.*?)\]/g;
    var customRegexMatches = customRegex.exec(name);
    var custom = customRegexMatches && customRegexMatches[0] ? customRegexMatches[0].substring(1, customRegexMatches[0].length - 1) : "";
    name = name.replace(customRegex, "");

    name = name.trim();

    result.push({
      name: name,
      color: color,
      custom: custom,
      subcategories: initializeCategoriesRecursively(dir),
      blocks: [],
    });
  }

  return result;
}

function bumpMessageNumbers(message) {
  var str = "%0 " + message;
  var nr = str.match(/%\d+/g).length;

  for (var i = nr - 1; i >= 0; i--) {
    str = str.replace("%" + i, "%" + Number.parseInt(i + 1));
  }

  return str;
}