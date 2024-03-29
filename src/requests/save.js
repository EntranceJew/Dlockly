const Blockly = require('node-blockly');
const convert = require('xml-js');
const fs = require('fs');
const matchall = require('match-all');
const path = require('path');
const read = require('fs-readdir-recursive');

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
    var guilds = data.discord.getConfigurableGuilds(data.bot, data.user).concat(data.discord.getConfigurableGuilds(data.bot, data.user, true)).map(g => g.id);
    if (!guilds.includes(data.req.body.guild)) {
      data.res.redirect("/");
      return;
    }

    if (!fs.existsSync(path.join(__dirname, "/../../data/"))) fs.mkdirSync(path.join(__dirname, "/../../data/"));
    if (!fs.existsSync(path.join(__dirname, "/../../data/", data.req.body.guild))) fs.mkdirSync(path.join(__dirname, "/../../data/", data.req.body.guild));

    var blocks = getBlocks(path.join(__dirname, "/../../blocks/custom/"));
    for (var block of blocks) {
      eval(`
        Blockly.JavaScript['${block.block.type}'] = function(block) {
          var _return;
          ${block.generator.replace(/\\\\/g, "\\")}
          return _return;
        }

        Blockly.Blocks['${block.block.type}'] = {
          init: function() {
            this.jsonInit(JSON.parse('${JSON.stringify(block.block).replace(/'/g, "\\'")}'));
          }
        }
      `);
    }

    var xml = decodeURIComponent(data.req.body.xml);
    var parsedXml = convert.js2xml(removeOverwrittenShadowsRecursively(convert.xml2js(xml)));
    parsedXml = parsedXml.replace(/#####/g, "");
    var dom = Blockly.Xml.textToDom(parsedXml);
    var workspace = new Blockly.Workspace();
    Blockly.Xml.domToWorkspace(dom, workspace);
    var js = Blockly.JavaScript.workspaceToCode(workspace);

    fs.writeFileSync(path.join(__dirname, "/../../data/", data.req.body.guild, "/blockly.xml"), xml);
    fs.writeFileSync(path.join(__dirname, "/../../data/", data.req.body.guild, "/bot.txt"), js);

    var regex = RegExp("##### (.*?) #####([\\s\\S]*?)(?=(?:$|#####))", "g");
    var matches = matchall(decodeURIComponent(js), regex);
    var obj = {};

    match = matches.nextRaw();
    while (match) {
      obj[match[1]] = match[2];

      match = matches.nextRaw();
    }

    var varRegex = RegExp("^var.*(?=(?:$|\\n))", "g");
    var match = decodeURIComponent(js).match(varRegex);
    if (match && match[0]) obj.var = match[0];

    fs.writeFileSync(path.join(__dirname, "/../../data/", data.req.body.guild, "/config.json"), JSON.stringify(obj));

    data.res.redirect("/?guild=" + data.req.body.guild);
  } catch (e) {
    console.error(e);
    data.res.redirect("/?guild=" + data.req.body.guild + "#error");
  }
}

function getBlocks(p) {
  var blocks = [];

  var files = read(p).filter(f => f.endsWith(".json"));

  for (var f of files) {
    if (f.startsWith("/") || f.startsWith("\\")) f = f.substring(1);
    if (f.endsWith("/") || f.endsWith("\\")) f.substr(0, f.length - 1);

    var json = JSON.parse(fs.readFileSync(path.join(p, f)));

    if (!json.generator) json.generator = '_return = \'\';';

    blocks.push(json);
  }

  return blocks;
}

function removeOverwrittenShadowsRecursively(obj) {
  var shadowElement, blockElement;
  if (obj.elements) {
    for (var element of obj.elements) {
      if (element.name == "shadow") shadowElement = element;
      if (element.name == "block") blockElement = element;
    }
  }

  if (shadowElement && blockElement) removeFromArray(obj.elements, shadowElement);

  if (obj.elements) {
    for (var index in obj.elements) {
      obj.elements[index] = removeOverwrittenShadowsRecursively(obj.elements[index]);
    }
  }

  return obj;
}

function removeFromArray(arr) {
  var what,
    a = arguments,
    L = a.length,
    ax;
  while (L > 1 && arr.length) {
    what = a[--L];
    while ((ax = arr.indexOf(what)) !== -1) {
      arr.splice(ax, 1);
    }
  }
  return arr;
}