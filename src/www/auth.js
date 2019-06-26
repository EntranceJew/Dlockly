try {
  if (auth.sessionValid(authUserID, authSession, db)) {
    res.redirect("/");
  } else {
    var code = req.query.code;
    if (!code) {
      res.redirect("/login");
    } else {
      var body = await request.post({
        uri: "https://discordapp.com/api/oauth2/token",
        body: querystring.stringify({
          'client_id': process.env.DISCORD_CLIENT_ID,
          'client_secret': process.env.DISCORD_CLIENT_SECRET,
          'grant_type': 'authorization_code',
          'redirect_uri': 'https://dlockly.glitch.me/auth',
          'scope': 'identify',
          'code': code
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      var {
        token_type: tokenType,
        access_token: accessToken
      } = JSON.parse(body);
      var data = await auth.getUserData(accessToken, tokenType, db);
      var userID = data.id;
      var sessionToken = auth.generateToken();
      auth.setToken(userID, sessionToken, accessToken, db);
      auth.setCookies(res, userID, sessionToken);
      res.redirect("/");
    }
  }
} catch (e) {
  res.redirect("/login");
}