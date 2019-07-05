if (auth.sessionValid(authUserID, authSession, db)) {
  auth.clearCookies(res);
  auth.removeToken(authUserID, db);
}
res.redirect("/");