const requestPromise = require('request-promise-native'); //For making API requests

async function gameInfo(domainQuery) {
  try {
    var response = await requestPromise({
      url: "https://api.nexusmods.com/v1/games/" + domainQuery,
      headers: {
        "Application-Name": "Nexus Mods Discord Bot",
        "Application-Version": 1.0,
        "apikey": process.env.NEXUS_TOKEN,
      }
    })
    var gameInfo = JSON.parse(response)
    return gameInfo
  } catch (err) {
    if (err.statusCode === 404) throw new Error(`${err.statusCode} - Game ${domainQuery} not found`)
    throw new Error(`API Error: Nexus Mods API responded with ${err.statusCode}.`)
  }
}

async function modInfo(gameDomain, modID) {
  try {
    var modData = await requestPromise({
      url: 'https://api.nexusmods.com/v1/games/' + gameDomain + '/mods/' + modID + '.json',
      headers: {
        "Application-Name": "Nexus Mods Discord Bot",
        "Application-Version": 1.0,
        "apikey": process.env.NEXUS_TOKEN,
      }
    });
    return JSON.parse(modData);
  } catch (err) {
    throw new Error(`API Error: Nexus Mods API responded with ${err.statusCode}.`)
  }
}