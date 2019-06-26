try {
  if (auth.sessionValid(authUserID, authSession, db)) {
    res.redirect("/");
  } else {
    var code = req.query.code;
    if (!code) {
      res.redirect("/login");
    } else {
      var bodyObj = {
        'client_id': process.env.DISCORD_CLIENT_ID,
        'client_secret': process.env.DISCORD_CLIENT_SECRET,
        'grant_type': 'authorization_code',
        'redirect_uri': 'https://dlockly.glitch.me/auth',
        'scope': 'identify',
        'code': code
      };
      var body = require('querystring').stringify(bodyObj);

      require('request-promise').post({
        uri: "https://discordapp.com/api/oauth2/token",
        body: body,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }).then(async response => {
        var reqObj = JSON.parse(response);

        var tokenType = reqObj.token_type;
        var accessToken = reqObj.access_token;

        var userData = await auth.getUserData(accessToken, tokenType, db);
        var userID = userData.id;
        var sessionToken = auth.generateToken();

        auth.setToken(userID, sessionToken, accessToken, db);
        auth.setCookies(res, userID, sessionToken);

        res.redirect("/");
      }).catch(e => {
        res.redirect("/login");
      });
    }
  }
} catch (e) {
  res.redirect("/login");
}