if (!fs.existsSync(__dirname + "/data/")) fs.mkdirSync(__dirname + "/data/");
if (!fs.existsSync(__dirname + "/data/" + req.query.guild)) fs.mkdirSync(__dirname + "/data/" + req.query.guild);

fs.writeFileSync(__dirname + "/data/" + req.query.guild + "/blockly.xml", decodeURIComponent(req.query.xml), {
  flag: "w"
});
fs.writeFileSync(__dirname + "/data/" + req.query.guild + "/bot.txt", decodeURIComponent(req.query.js), {
  flag: "w"
});

console.log(req.query);

res.redirect("/?guild=" + req.query.guild);