require('dotenv').config();
const http = require("http");
const express = require('express');
const Discord = require('discord.js');
const fs = require('fs');
const read = require('fs-readdir-recursive');
const uap = require('express-useragent');
const path = require('path');

var web = express();
web.set("views", __dirname);
web.use(uap.express());
const bot = new Discord.Client();

async function boot() {
  bot.login(process.env.DISCORD_TOKEN);
  web.listen(process.env.PORT);
}

web.get('*', async (req, res) => {
  var path = req.path;

  if (path.endsWith(".js") || path.endsWith(".css") || path.endsWith(".ico")) {
    console.log("Sending file '" + __dirname + path + "'");
    res.sendFile(__dirname + path);
  } else {
    console.log("Attempted to access file '" + __dirname + path + "'. Rendering main page instead");
    var categories = initializeCategoriesRecursively("./blocks/");
    var {
      blocks,
      max,
      restrictions,
      generators
    } = initializeBlocksRecursively("./blocks/", categories);

    res.render("src/dlockly.ejs", {
      blocks: blocks,
      max: JSON.stringify(max),
      categories: categories,
      restrictions: JSON.stringify(restrictions),
      xmlCategoryTree: generateXmlTreeRecursively(categories),
      generators: generators
    });
  }
});

function generateXmlTreeRecursively(categories) {
  var result = "";
  for (var c of categories) {
    result += "<category name='" + c.name + "' colour='" + c.color + "'>";
    result += generateXmlTreeRecursively(c.subcategories);
    for (var b of c.blocks) {
      result += "<block type='" + b + "'></block>";
    }
    result += "</category>"
  }
  return result;
}

function initializeBlocksRecursively(p, categories) {
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
    var fileName = splits.pop();

    blocks.push(json.block);

    if (json.max) max[json.block.type] = json.max;

    if (json.restrictions) restrictions[json.block.type] = json.restrictions;

    var desiredCategoryName = splits.pop();
    var desiredCategory = findCategoryRecursively(categories, desiredCategoryName);

    if (desiredCategory) desiredCategory.blocks.push(json.block.type);
    else console.warn("Category '" + desiredCategory + "' required for block '" + json.block.type + "' was not found.");

    if (json.generator) {
      generators.push({
        type: json.block.type,
        generator: json.generator.code
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
  for (var c of categories) {
    if (c.name == cat) return c;

    var subcat = findCategoryRecursively(c.subcategories, cat);
    if (subcat) return subcat;
  }
}

function initializeCategoriesRecursively(p) {
  var isDirectory = source => fs.lstatSync(source).isDirectory();
  var dirs = fs.readdirSync(p).map(name => path.join(p, name)).filter(isDirectory);

  var result = [];
  for (var dir of dirs) {
    result.push({
      name: dir.split(/[\/\\]+/g).pop(),
      color: Number.parseInt(fs.readFileSync(path.join(dir, "/.color"))),
      subcategories: initializeCategoriesRecursively(dir),
      blocks: [],
    });
  }

  return result;
}

setInterval(() => {
  http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
}, 280000);

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

boot();