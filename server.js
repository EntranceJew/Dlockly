require('dotenv').config();

const http = require("http");
const express = require('express');
const Discord = require('discord.js');
const fs = require('fs');
const path = require('path');

const auth = require('./src/auth');
const discord = require('./src/discord');
const dlockly = require('./src/dlockly');
const utils = require('./src/utils');

var web = express();
web.set("views", __dirname);
web.use(require('express-useragent').express());
web.use(require('cookie-parser')());
web.use(require('body-parser').json());
web.use(require('body-parser').urlencoded({
  extended: false
}));
const bot = new Discord.Client();
const db = require('better-sqlite3')('data/db.db');

function boot() {
  db.prepare("CREATE TABLE if not exists logindata (userid TEXT PRIMARY KEY, sessionkey TEXT, authkey TEXT);").run();
  web.listen(process.env.PORT);
  bot.login(process.env.DISCORD_TOKEN);
}

web.all('*', async (req, res) => {
  if (fs.existsSync(path.join(__dirname, "/config/disable"))) {
    res.sendFile(path.join(__dirname, "/www/html/maintenance.html"));
    return;
  }

  var browser = req.useragent.browser;
  if (browser != "Chrome" && browser != "Firefox") {
    res.sendFile(path.join(__dirname, "/www/html/browserunsup.html"));
    return;
  }

  var {
    authUserID,
    authSession
  } = auth.getCookies(req);
  var authToken = auth.getToken(authUserID, db);
  var user = await discord.getUser(bot, authUserID);

  if (req.path.endsWith(".js") || req.path.endsWith(".css") || req.path.endsWith(".ico") || req.path.endsWith(".html")) {
    res.sendFile(path.join(__dirname, req.path));
  } else if (fs.existsSync(path.join(__dirname, "/src/requests/", req.path + ".js"))) {
    require('./' + path.join('src/requests/', req.path))({
      auth,
      authSession,
      authUserID,
      bot,
      db,
      discord,
      res,
      req,
      user
    });
  } else {
    if (!auth.sessionValid(authUserID, authSession, db)) {
      res.sendFile(path.join(__dirname, "/www/html/login.html"));
      return;
    }

    if (!user) {
      res.sendFile(path.join(__dirname, "/www/html/unknownuser.html"));
      return;
    }

    if (!discord.getConfigurableGuilds(bot, user).map(g => g.id).includes(req.query.guild)) {
      res.render("www/html/guildpicker.ejs", {
        user: user,
        configurableGuilds: discord.getConfigurableGuilds(bot, user),
      });
      return;
    }

    var categories = dlockly.initializeCategoriesRecursively("./blocks/");
    var {
      blocks,
      max,
      restrictions,
      generators
    } = dlockly.initializeBlocksRecursively("./blocks/", categories);

    res.render("www/html/dlockly.ejs", {
      blocks: blocks,
      max: JSON.stringify(max),
      categories: categories,
      restrictions: JSON.stringify(restrictions),
      xmlCategoryTree: dlockly.generateXmlTreeRecursively(categories),
      generators: generators,
      blocklyXml: dlockly.getBlocklyXml(req.query.guild),
      exampleXml: dlockly.getExampleXml()
    });
  }
});

setInterval(() => {
  http.get(`http://dlockly.glitch.me/`);
}, 280000);

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
});

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: ', p, 'reason:', reason);
});

bot.on('error', (e) => {
  console.error(e);
})

bot.on('warn', (w) => {
  console.warn(w);
});

boot();