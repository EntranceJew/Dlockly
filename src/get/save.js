if (!fs.existsSync(__dirname + "/data/")) fs.mkdirSync(__dirname + "/data/");
if (!fs.existsSync(__dirname + "/data/" + req.query.guild)) fs.mkdirSync(__dirname + "/data/" + req.query.guild);

fs.writeFileSync(__dirname + "/data/" + req.query.guild + "/blockly.xml", req.query.xml, {
  flag: "w"
});
fs.writeFileSync(__dirname + "/data/" + req.query.guild + "/bot.txt", req.query.js, {
  flag: "w"
});

res.redirect("/?guild=" + req.query.guild);