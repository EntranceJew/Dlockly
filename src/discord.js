module.exports.getUser = async function (bot, id) {
  return (await this.getUsers(bot))[id];
}

module.exports.getUsers = async function (bot) {
  var guilds = bot.guilds.array();
  var result = {};

  for (var guild of guilds) {
    var _guild = await bot.guilds.get(guild.id).fetchMembers();

    _guild.members.forEach((v, k) => result[k] = v);
  }

  return result;
}

module.exports.getConfigurableGuilds = function (bot, _member) {
  var guilds = bot.guilds.array();
  var user = _member.user;
  var goodGuilds = [];
  for (var guild of guilds) {
    var member = guild.member(user);
    if (!member) continue;
    if (member.hasPermission('MANAGE_GUILD')) goodGuilds.push(guild);
  }
  return goodGuilds;
}