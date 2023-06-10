const jwtSecret = 'your_jwt_secret'

const jwt = require('jsonwebtoken'),
  passport = require('passport')

require('./passport')

let generateJWTToken = (user) => {
  return jwt.sign(user, jwtSecret, {
    subject: user.Username, //This is the username being encoded in the JWT
    expiresIn: '7d', //The token expires in seven days
    algorithm: 'HS256', //This is the algorithm used to sign or encode the values of the JWT
  })
}

// POST login

module.exports = (router) => {
  router.post('/login', (req, res) => {
    passport.authenticate('local', { session: false }, (error, user, info) => {
      console.log(error)
      if (error || !user) {
        return res.status(400).json({
          message: 'Username or password is incorrect',
          user: user,
        })
      }
      req.login(user, { session: false }, (error) => {
        if (error) {
          res.send(error)
        }
        let token = generateJWTToken(user.toJSON())
        return res.json({ user, token })
      })
    })(req, res)
  })
}
