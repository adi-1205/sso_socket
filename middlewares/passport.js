const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const GoogleStrategy = require('passport-google-oauth2').Strategy;

const User = require('../models').User;

const opt = {
    jwtFromRequest: function (req) {
        if (req.cookies && req.cookies.auth)
            return req.cookies.auth
        else
            return null
    },
    secretOrKey: process.env.JWT_SECRET
}

module.exports = (passport) => {
    passport.use(new GoogleStrategy({
        clientID: process.env.OAUTH_CLIENT,
        clientSecret: process.env.OAUTH_SECRET,
        callbackURL: "http://localhost:8000/auth/google/redirect",
        passReqToCallback: true
    },
        async function (request, accessToken, refreshToken, profile, done) {
            try {
                let [user, created] = await User.findOrCreate({
                    where: { email: profile._json.email, by_google: true },
                    defaults: {
                        username: profile.displayName,
                        by_google: true
                    }
                })
                done(null, user)
            } catch (err) {
                console.log(err);
                done(err, false)
            }
        }
    ));

    passport.use(
        new JwtStrategy(opt, (jwt_payload, done) => {
            User.findByPk(jwt_payload.id)
                .then(user => {
                    if (user) {
                        return done(null, user);
                    } else {
                        return done(null, false);
                    }
                })
                .catch(err => {
                    return done(err, false);
                })
        })
    )

    passport.serializeUser(function (user, done) {
        done(null, user);
    });

    passport.deserializeUser(function (user, done) {
        done(null, user);
    });
}