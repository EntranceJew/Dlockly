try {
  if (!fs.existsSync(__dirname + "/data/")) fs.mkdirSync(__dirname + "/data/");
  if (!fs.existsSync(__dirname + "/data/" + req.body.guild)) fs.mkdirSync(__dirname + "/data/" + req.body.guild);

  fs.writeFileSync(__dirname + "/data/" + req.body.guild + "/blockly.xml", decodeURIComponent(req.body.xml), {
    flag: "w"
  });
  fs.writeFileSync(__dirname + "/data/" + req.body.guild + "/bot.txt", decodeURIComponent(req.body.js), {
    flag: "w"
  });

  var regex = RegExp("##### (.*?) #####([\\s\\S]*?)(?=(?:$|#####))", "g");
  var matches = require('match-all')(decodeURIComponent(req.body.js), regex);
  var obj = {};

  match = matches.nextRaw();
  while (match) {
    obj[match[1]] = match[2];

    match = matches.nextRaw();
  }

  var varRegex = RegExp("^var.*(?=(?:$|\\n))", "g");
  var match = decodeURIComponent(req.body.js).match(varRegex);
  if (match && match[0]) obj.var = match[0];

  fs.writeFileSync(__dirname + "/data/" + req.body.guild + "/config.json", JSON.stringify(obj), {
    flag: "w"
  });

  res.redirect("/?guild=" + req.body.guild);
} catch (e) {
  console.error(e);
  res.redirect("/?guild=" + req.body.guild);
}