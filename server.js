require('dotenv').config();
const http = require("http");
const express = require('express');
const Discord = require('discord.js');
const fs = require('fs');
const read = require('fs-readdir-recursive');
const path = require('path');

const auth = require('./src/auth');
const icons = require('./config/icons.json');

var web = express();
web.set("views", __dirname);
web.use(require('express-useragent').express());
web.use(require('cookie-parser')());
web.use(require('body-parser').json());
web.use(require('body-parser').urlencoded({
  extended: false
}));
const bot = new Discord.Client();

var db = require('better-sqlite3')('data/db.db');

async function boot() {
  db.prepare("CREATE TABLE if not exists logindata (userid TEXT PRIMARY KEY, sessionkey TEXT, authkey TEXT);").run();
  web.listen(process.env.PORT);
  bot.login(process.env.DISCORD_TOKEN);
}

web.all('*', async (req, res) => {
  var browser = req.useragent.browser;
  if (browser != "Chrome" && browser != "Firefox") {
    res.send(`
      <link href="https://fonts.googleapis.com/css?family=Days+One&display=swap" rel="stylesheet">
      <style>
      * {
        font-family: 'Days One', sans-serif;
      }
      h1 {
        font-size: 40px;
      }
      </style>
      <h1>Please use <a href='https://www.google.com/chrome/'>Google Chrome</a> or <a href='https://www.mozilla.org/en-US/firefox/new/'>Mozilla Firefox</a> in order to view this webpage</h1>
    `)
    return;
  }

  var {
    authUserID,
    authSession
  } = auth.getCookies(req);
  var authToken = auth.getToken(authUserID, db);
  var authUserData = auth.sessionValid(authUserID, authSession, db) ? await auth.getUserData(authToken) : undefined;

  var p = req.path;

  if (p.endsWith(".js") || p.endsWith(".css") || p.endsWith(".ico") || p.endsWith(".html")) {
    res.sendFile(__dirname + p);
  } else if (p.match("^/auth/?$") || p.match("^/login/?$") || p.match("^/logout/?$") || p.match("^/save/?$")) {
    eval(bin2String(fs.readFileSync(__dirname + "/src/get" + p + ".js")));
  } else {
    if (!auth.sessionValid(authUserID, authSession, db)) {
      res.send(`
        <link href="https://fonts.googleapis.com/css?family=Days+One&display=swap" rel="stylesheet">
        <style>
          a {
            position: fixed;
            left: calc(50% - 268px);
            top: calc(50% - 60px);
            font-size: 40px;
            width: 536px;
            height: 96px;
            font-style: normal;
            font-weight: bold;
            color: #000;
            text-decoration: none;
            font-family: 'Days One', sans-serif;
          }
          #navbar-discord-logo {
            vertical-align: middle;
            height: 100px;
          }
        </style>
        <div>
          <a id="navbar-editor" href="/login" target="_top">Login with <svg id="navbar-discord-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 272.1">
          <path d="M142.8 120.1c-5.7 0-10.2 4.9-10.2 11s4.6 11 10.2 11c5.7 0 10.2-4.9 10.2-11s-4.6-11-10.2-11zM106.3 120.1c-5.7 0-10.2 4.9-10.2 11s4.6 11 10.2 11c5.7 0 10.2-4.9 10.2-11 .1-6.1-4.5-11-10.2-11z"></path>
          <path d="M191.4 36.9h-134c-11.3 0-20.5 9.2-20.5 20.5v134c0 11.3 9.2 20.5 20.5 20.5h113.4l-5.3-18.3 12.8 11.8 12.1 11.1 21.6 18.7V57.4c-.1-11.3-9.3-20.5-20.6-20.5zm-38.6 129.5s-3.6-4.3-6.6-8c13.1-3.7 18.1-11.8 18.1-11.8-4.1 2.7-8 4.6-11.5 5.9-5 2.1-9.8 3.4-14.5 4.3-9.6 1.8-18.4 1.3-25.9-.1-5.7-1.1-10.6-2.6-14.7-4.3-2.3-.9-4.8-2-7.3-3.4-.3-.2-.6-.3-.9-.5-.2-.1-.3-.2-.4-.2-1.8-1-2.8-1.7-2.8-1.7s4.8 7.9 17.5 11.7c-3 3.8-6.7 8.2-6.7 8.2-22.1-.7-30.5-15.1-30.5-15.1 0-31.9 14.4-57.8 14.4-57.8 14.4-10.7 28-10.4 28-10.4l1 1.2c-18 5.1-26.2 13-26.2 13s2.2-1.2 5.9-2.8c10.7-4.7 19.2-5.9 22.7-6.3.6-.1 1.1-.2 1.7-.2 6.1-.8 13-1 20.2-.2 9.5 1.1 19.7 3.9 30.1 9.5 0 0-7.9-7.5-24.9-12.6l1.4-1.6s13.7-.3 28 10.4c0 0 14.4 25.9 14.4 57.8 0-.1-8.4 14.3-30.5 15zM303.8 79.7h-33.2V117l22.1 19.9v-36.2h11.8c7.5 0 11.2 3.6 11.2 9.4v27.7c0 5.8-3.5 9.7-11.2 9.7h-34v21.1h33.2c17.8.1 34.5-8.8 34.5-29.2v-29.8c.1-20.8-16.6-29.9-34.4-29.9zm174 59.7v-30.6c0-11 19.8-13.5 25.8-2.5l18.3-7.4c-7.2-15.8-20.3-20.4-31.2-20.4-17.8 0-35.4 10.3-35.4 30.3v30.6c0 20.2 17.6 30.3 35 30.3 11.2 0 24.6-5.5 32-19.9l-19.6-9c-4.8 12.3-24.9 9.3-24.9-1.4zM417.3 113c-6.9-1.5-11.5-4-11.8-8.3.4-10.3 16.3-10.7 25.6-.8l14.7-11.3c-9.2-11.2-19.6-14.2-30.3-14.2-16.3 0-32.1 9.2-32.1 26.6 0 16.9 13 26 27.3 28.2 7.3 1 15.4 3.9 15.2 8.9-.6 9.5-20.2 9-29.1-1.8l-14.2 13.3c8.3 10.7 19.6 16.1 30.2 16.1 16.3 0 34.4-9.4 35.1-26.6 1-21.7-14.8-27.2-30.6-30.1zm-67 55.5h22.4V79.7h-22.4v88.8zM728 79.7h-33.2V117l22.1 19.9v-36.2h11.8c7.5 0 11.2 3.6 11.2 9.4v27.7c0 5.8-3.5 9.7-11.2 9.7h-34v21.1H728c17.8.1 34.5-8.8 34.5-29.2v-29.8c0-20.8-16.7-29.9-34.5-29.9zm-162.9-1.2c-18.4 0-36.7 10-36.7 30.5v30.3c0 20.3 18.4 30.5 36.9 30.5 18.4 0 36.7-10.2 36.7-30.5V109c0-20.4-18.5-30.5-36.9-30.5zm14.4 60.8c0 6.4-7.2 9.7-14.3 9.7-7.2 0-14.4-3.1-14.4-9.7V109c0-6.5 7-10 14-10 7.3 0 14.7 3.1 14.7 10v30.3zM682.4 109c-.5-20.8-14.7-29.2-33-29.2h-35.5v88.8h22.7v-28.2h4l20.6 28.2h28L665 138.1c10.7-3.4 17.4-12.7 17.4-29.1zm-32.6 12h-13.2v-20.3h13.2c14.1 0 14.1 20.3 0 20.3z"></path>
        </svg></<a>
        </div>
      `);
      return;
    }

    var user = await getUser(authUserID);
    if (!user) {
      res.send(`
        <link href="https://fonts.googleapis.com/css?family=Days+One&display=swap" rel="stylesheet">
        <style>
        * {
          font-family: 'Days One', sans-serif;
        }
        h1 {
          font-size: 40px;
        }
        p {
          font-size: 20px;
        }
        </style>
        <h1>Unknown User</h1>
        <p>Make sure that you have a common guild with the bot</p>
        <p>You can invite the bot <a href='https://discordapp.com/oauth2/authorize?client_id=591694201230721043&scope=bot&permissions=8'>here</a></p>

        <a href="logout"><button>Logout</button></a>
      `);
      return;
    }

    if (!getGuild(req.query.guild)) {
      var toSend = `
        <link href="https://fonts.googleapis.com/css?family=Days+One&display=swap" rel="stylesheet">
        <style>
        * {
          font-family: 'Days One', sans-serif;
        }
        h1 {
          font-size: 40px;
        }
        h2 {
          font-size: 30px;
        }
        p {
          font-size: 20px;
        }
        </style>
        <h1>Logged in as "${user.user.username}#${user.user.discriminator}"</h1>
        <a href='logout'><button>Log out</button></a><br>
      `;
      var configurableGuilds = getGuildsMemberIsIn(user);
      if (configurableGuilds && configurableGuilds[0]) {
        toSend += "<h2>Pick a server to view/edit it's configuration</h2><ul>"
        for (var guild of configurableGuilds) {
          toSend += "<li><a href='/?guild=" + guild.id + "'>" + guild.name + "</a></li>";
        }
        toSend += "</ul>";
      } else {
        toSend += `
          <h2>You have no servers available<h2>
          <p>You can invite the bot <a href='https://discordapp.com/oauth2/authorize?client_id=591694201230721043&scope=bot&permissions=8'>here</a></p>
        `;
      }
      res.send(toSend);
      return;
    }

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
      generators: generators,
      blocklyXml: getBlocklyXml(req.query.guild),
      exampleXml: getExampleXml(),
      readOnly: !getConfigurableGuilds(user).map(g => g.id).includes(req.query.guild),
    });
  }
});

function getBlocklyXml(id) {
  if (!fs.existsSync(__dirname + "/data/")) {
    fs.mkdirSync(__dirname + "/data/");
    return '';
  }
  if (!fs.existsSync(__dirname + "/data/" + id)) {
    fs.mkdirSync(__dirname + "/data/" + id);
    return '';
  }
  if (!fs.existsSync(__dirname + "/data/" + id + "/blockly.xml")) {
    return '';
  }
  return fs.readFileSync(__dirname + "/data/" + id + "/blockly.xml");
}

function getExampleXml() {
  return fs.readFileSync(__dirname + "/config/example.xml");
}

async function getUser(id) {
  return (await getUsers())[id];
}

async function getUsers() {
  var guilds = bot.guilds.array();
  var result = {};

  for (var guild of guilds) {
    var _guild = await bot.guilds.get(guild.id).fetchMembers();

    _guild.members.forEach((v, k) => result[k] = v);
  }

  return result;
}

function getGuild(id) {
  return getGuilds().get(id);
}

function getConfigurableGuilds(_member) {
  var guilds = getGuilds().array();
  var user = _member.user;
  var goodGuilds = [];
  for (var guild of guilds) {
    var member = guild.member(user);
    if (!member) continue;
    if (member.hasPermission('MANAGE_GUILD')) goodGuilds.push(guild);
  }
  return goodGuilds;
}

function getGuildsMemberIsIn(_member) {
  var guilds = getGuilds().array();
  var user = _member.user;
  var goodGuilds = [];
  for (var guild of guilds) {
    var member = guild.member(user);
    if (!member) continue;
    goodGuilds.push(guild);
  }
  return goodGuilds;
}

function getGuilds() {
  return bot.guilds;
}

function generateXmlTreeRecursively(categories) {
  var result = "";
  for (var c of categories) {
    result += "<category name='" + c.name.replace(/_/g, "") + "' colour='" + c.color + "'>";
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
    var desiredCategory = findCategoryRecursively(categories, desiredCategoryName);

    if (desiredCategory) desiredCategory.blocks.push(json.block.type);

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

function bumpMessageNumbers(message) {
  var str = "%0 " + message;
  var nr = str.match(/%\d+/g).length;

  for (var i = nr - 1; i >= 0; i--) {
    str = str.replace("%" + i, "%" + Number.parseInt(i + 1));
  }

  return str;
}

function bin2String(array) {
  if (typeof array == typeof "str") return array;
  return String.fromCharCode.apply(String, array);
}

setInterval(() => {
  http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
}, 280000);

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: ', p, 'reason:', reason);
});

bot.on('error', (e) => {
  console.error(e);
})

bot.on('warn', (w) => {
  console.warn(w);
});

var events = {
  "channelCreate": {
    "parameters": ["channel"],
    "check": "channel.guild",
    "guildGetter": "channel.guild"
  },
  "channelDelete": {
    "parameters": ["channel"],
    "check": "channel.guild",
    "guildGetter": "channel.guild"
  },
  "emojiCreate": {
    "parameters": ["emoji"],
    "check": "emoji.guild",
    "guildGetter": "emoji.guild"
  },
  "emojiDelete": {
    "parameters": ["emoji"],
    "check": "emoji.guild",
    "guildGetter": "emoji.guild"
  },
  "guildBanAdd": {
    "parameters": ["guild", "user"],
    "check": "guild",
    "guildGetter": "guild"
  },
  "guildBanRemove": {
    "parameters": ["guild", "user"],
    "check": "guild",
    "guildGetter": "guild"
  },
  "guildMemberAdd": {
    "parameters": ["member"],
    "check": "member.guild",
    "guildGetter": "member.guild"
  },
  "guildMemberRemove": {
    "parameters": ["member"],
    "check": "member.guild",
    "guildGetter": "member.guild"
  },
  "message": {
    "parameters": ["message"],
    "check": "message.guild && !message.author.bot",
    "guildGetter": "message.guild"
  },
  "messageDelete": {
    "parameters": ["message"],
    "check": "message.guild",
    "guildGetter": "message.guild"
  },
  "roleCreate": {
    "parameters": ["role"],
    "check": "role.guild",
    "guildGetter": "role.guild"
  },
  "roleDelete": {
    "parameters": ["role"],
    "check": "role.guild",
    "guildGetter": "role.guild"
  }
}

bot.on("ready", () => {
  bot.user.setActivity("with blocks. https://dlockly.glitch.me");

  for (var event in events) {
    if (events.hasOwnProperty(event)) {
      var parameters = events[event].parameters;
      var check = events[event].check;
      var guild = events[event].guildGetter;

      try {
        eval(`bot.on('${event}', (${parameters.join(",")}) => {
          if (!(${check})) return;
          var guild = ${guild};
          if (fs.existsSync(__dirname + "/data/" + guild.id + "/config.json")) {
            var json = fs.readFileSync(__dirname + "/data/" + guild.id + "/config.json");
            var obj = JSON.parse(json);
            if (obj.var) eval(obj.var);
            if (obj.${event}) eval(obj.${event});
          }
        });`)
      } catch (e) {
        console.exception(e);
      }
    }
  }
})

boot();