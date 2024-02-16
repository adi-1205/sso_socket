const passport = require('passport');

module.exports = (req, res, next) => {
  passport.authenticate('jwt', { session: true }, (err, user) => {
    if (err) {
      return next(err);
    }
    if (!user && req.url === '/') {
      req.session.user = null
      return next()
    }
    if (!user) {
      return res.redirect('/auth/login');
    }
    if (user.role === 'admin') {
      return res.redirect('/auth/login');
    }
    req.session.user = user
    req.session.sessionExpire = process.env.JWT_EXPIRATION
    next();
  })(req, res, next);
}