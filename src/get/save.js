if (!fs.existsSync(__dirname + "/data/")) fs.mkdirSync(__dirname + "/data/");
if (!fs.existsSync(__dirname + "/data/" + req.query.guild)) fs.mkdirSync(__dirname + "/data/" + req.query.guild);

fs.writeFileSync(__dirname + "/data/" + req.query.guild + "/blockly.xml", req.query.xml, {
  flag: "w"
});
fs.writeFileSync(__dirname + "/data/" + req.query.guild + "/bot.txt", req.query.js, {
  flag: "w"
});

var regex = RegExp("(?:^|\\n)##### (.*?) #####([\\s\\S]*?)(?=(?:$|#####))", "g");
var matches = require('match-all')(req.query.js, regex);
var obj = {};

match = matches.nextRaw();
while (match) {
  obj[match[1]] = match[2];

  match = matches.nextRaw();
}

var varRegex = RegExp("^var.*(?=(?:$|\\n))", "g");
var match = req.query.js.match(varRegex);

obj.var = match[0];

fs.writeFileSync(__dirname + "/data/" + req.query.guild + "/config.json", JSON.stringify(obj), {
  flag: "w"
});

res.redirect("/?guild=" + req.query.guild);