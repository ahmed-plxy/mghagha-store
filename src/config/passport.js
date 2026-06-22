const passport = require('passport');
const env = require('./env');
const userRepo = require('../repositories/user.repo');

if (env.googleClientId && env.googleClientSecret) {
  const GoogleStrategy = require('passport-google-oauth20').Strategy;
  passport.use(new GoogleStrategy({
    clientID: env.googleClientId,
    clientSecret: env.googleClientSecret,
    callbackURL: (env.appBaseUrl || '') + '/auth/google/callback'
  }, function (accessToken, refreshToken, profile, done) {
    try {
      const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
      const avatarUrl = profile.photos && profile.photos[0] ? profile.photos[0].value : null;
      const user = userRepo.findOrCreateGoogleUser({
        googleId: profile.id,
        fullName: profile.displayName || 'مستخدم جوجل',
        email,
        avatarUrl,
      });
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));
}

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  try {
    const user = userRepo.findById(id);
    done(null, user || false);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
