const passport = require('passport');
const { Strategy: JwtStrategy } = require('passport-jwt');
const User = require('../models/userModel');

const cookieExtractor = (req) => {
    let token = null;
    if (req && req.cookies) token = req.cookies['jwt'];
    return token;
};

passport.use(new JwtStrategy(
    { jwtFromRequest: cookieExtractor, secretOrKey: process.env.JWT_SECRET },
    async (payload, done) => {
        try {
            const user = await User.findById(payload.id);
            if (!user) return done(null, false);
            return done(null, user);
        } catch (err) {
            return done(err, false);
        }
    }
));

module.exports = passport.authenticate('jwt', { session: false });