const fs = require('fs');
const matchall = require('match-all');
const path = require('path');

module.exports = function (data) {
  try {
    if (!data.auth.sessionValid(data.req.cookies.auth_userid, data.req.cookies.auth_session, data.db)) {
      data.res.redirect("/");
      return;
    }
    if (!data.user) {
      data.res.redirect("/");
      return;
    }
    var guilds = data.discord.getConfigurableGuilds(data.bot, data.user).map(g => g.id);
    if (!guilds.includes(data.req.body.guild)) {
      data.res.redirect("/");
      return;
    }

    if (!fs.existsSync(path.join(__dirname, "/../../data/"))) fs.mkdirSync(path.join(__dirname, "/../../data/"));
    if (!fs.existsSync(path.join(__dirname, "/../../data/", data.req.body.guild))) fs.mkdirSync(path.join(__dirname, "/../../data/", data.req.body.guild));

    fs.writeFileSync(path.join(__dirname, "/../../data/", data.req.body.guild, "/blockly.xml"), decodeURIComponent(data.req.body.xml), {
      flag: "w"
    });
    fs.writeFileSync(path.join(__dirname, "/../../data/", data.req.body.guild, "/bot.txt"), decodeURIComponent(data.req.body.js), {
      flag: "w"
    });

    var regex = RegExp("##### (.*?) #####([\\s\\S]*?)(?=(?:$|#####))", "g");
    var matches = matchall(decodeURIComponent(data.req.body.js), regex);
    var obj = {};

    match = matches.nextRaw();
    while (match) {
      obj[match[1]] = match[2];

      match = matches.nextRaw();
    }

    var varRegex = RegExp("^var.*(?=(?:$|\\n))", "g");
    var match = decodeURIComponent(data.req.body.js).match(varRegex);
    if (match && match[0]) obj.var = match[0];

    fs.writeFileSync(path.join(__dirname, "/../../data/", data.req.body.guild, "/config.json"), JSON.stringify(obj), {
      flag: "w"
    });

    data.res.redirect("/?guild=" + data.req.body.guild);
  } catch (e) {
    console.error(e);
    data.res.redirect("/?guild=" + data.req.body.guild + "#error");
  }
}