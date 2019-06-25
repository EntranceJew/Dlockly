const dotenv = require('dotenv');
dotenv.config();

const cmd = require("node-cmd");
const crypto = require("crypto");
const request = require('request-promise');
const http = require("http");
const https = require("https");
const express = require('express');
const Discord = require('discord.js');
const sql = require('better-sqlite3');
const fs = require('fs');
const read = require('fs-readdir-recursive');
const querystring = require('querystring');
const ejs = require('ejs');
const uap = require('express-useragent');

var web = express();
web.set("views", __dirname);
web.use(uap.express());
const bot = new Discord.Client();

async function boot() {
  await bot.login(process.env.DISCORD_TOKEN);
  web.listen(process.env.PORT);
}

web.get('*', async (req, res) => {
  var path = req.path;

  if (path.endsWith(".js" || path.endsWith(".css")))
    res.sendFile(__dirname + path);
  else {
    var blocks = [];
    var max = {};
    var categories = [];
    var restrictions = {};

    var files = read("./blocks/").filter(f => f.endsWith(".json"));
    files.forEach(f => {
      var json = JSON.parse(fs.readFileSync("./blocks/" + f));
      var splits = f.split(/[\/\\]+/g);
      var category = splits[0];

      if (json.block) blocks.push(json.block);
      else if (json.js_block) blocks.push(json.js_block);
      else return;

      if (json.max) max[json.block.type] = json.max;

      if (json.restrictions) restrictions[json.block ? json.block.type : json.js_block.type] = json.restrictions;

      if (splits[0] && splits[1]) {
        if (categories.find(o => o.name == category)) categories.filter(o => o.name == category)[0].blocks.push(json.block ? json.block.type : json.js_block.type);
        else categories.push({
          name: category,
          color: (json.block ? json.block : json.js_block).colour,
          blocks: [json.block ? json.block.type : json.js_block.type]
        })
      } else {
        if (categories.find(o => o.name == "Discord")) categories.filter(o => o.name == "Discord")[0].blocks.push(json.block ? json.block.type : json.js_block.type);
        else categories.push({
          name: "Discord",
          blocks: [json.block ? json.block.type : json.js_block.type]
        })
      }
    })

    res.render("src/dlockly.ejs", {
      blocks: blocks,
      max: JSON.stringify(max),
      categories: categories,
      restrictions: JSON.stringify(restrictions),
    });
  }
});

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

boot();