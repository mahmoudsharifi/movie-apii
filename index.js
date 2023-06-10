const express = require('express'),
  mongoose = require('mongoose'),
  fs = require('fs'),
  path = require('path'),
  bodyParser = require('body-parser'),
  uuid = require('uuid'),
  app = express(),
  dotenv = require('dotenv')
Models = require('./models.js')

// use .env file to hide sensitive data
dotenv.config()

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
const { check, validationResult } = require('express-validator')

const cors = require('cors')
app.use(cors())

//Middleware
;(morgan = require('morgan')), app.use(express.static('public'))
app.use(morgan('common'))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

const Movies = Models.Movie
const Users = Models.User

// Authentication and Authorisation

let auth = require('./auth')(app)
const passport = require('passport')
require('./passport')

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {
  flags: 'a',
})
app.use(morgan('combined', { stream: accessLogStream }))

app.get('/', (req, res) => {
  res.send('Welcome to my movie API!')
})

//Shows the documentatin for the API

app.get('/documentation', (req, res) => {
  res.sendFile('documentation.html', { root: 'public' })
})

// CREATE post a new user

app.post(
  '/users',
  [
    check('Username', 'Username is required').isLength({ min: 5 }), //Username minimum length 5 characters
    check(
      'Username',
      'Username contains non alphanumeric characters - not allowed'
    ).isAlphanumeric(), //Username must contain only aplhanumeric characters
    check('Password', 'Password is required').not().isEmpty(), //Password field cannot be empty
    check('Email', 'Email does not appear to be valid').isEmail(), //Must have a valid email address
  ],
  (req, res) => {
    // check the validation object for errors
    let errors = validationResult(req)

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() })
    }
    console.log(Users)
    let hashedPassword = Users.hashPassword(req.body.Password)
    Users.findOne({ Username: req.body.Username }) // searches to find if the user already exists
      .then((user) => {
        if (user) {
          return res.status(400).json({ message: 'Username already exists' })
        } else {
          Users.create({
            Username: req.body.Username,
            Password: hashedPassword,
            Email: req.body.Email,
            Age: req.body.Age,
          })
            .then((user) => {
              res.status(201).json(user)
            })
            .catch((error) => {
              console.error(error)
              res.status(500).json({ error: error })
            })
        }
      })
      .catch((error) => {
        console.error(error)
        res.status(500).json({ error: error })
      })
  }
)

// Get all users

app.get(
  '/users',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Users.find()
      .then((users) => {
        res.status(201).json(users)
      })
      .catch((err) => {
        console.error(err)
        res.status(500).send('Error: ' + err)
      })
  }
)

// get a user by their username

app.get(
  '/users/:Username',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Users.findOne({ Username: req.params.Username })
      .then((user) => {
        res.json(user)
      })
      .catch((err) => {
        console.error(err)
        res.status(500).send('Error: ' + err)
      })
  }
)

// UPDATE a users info by username

app.put(
  '/users/:Username',
  passport.authenticate('jwt', { session: false }),
  [
    check('Username', 'Username is required').isLength({ min: 5 }),
    check(
      'Username',
      'Username contains non alphanumeric characters - not allowed'
    ).isAlphanumeric(),
    check('Password', 'Password is required').not().isEmpty(),
    check('Email', 'Email is not valid').isEmail().normalizeEmail(),
  ],
  (req, res) => {
    let errors = validationResult(req)

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() })
    }

    let hashedPassword = Users.hashPassword(req.body.Password)

    Users.findOneAndUpdate(
      { Username: req.params.Username },
      {
        $set: {
          Username: req.body.Username,
          Password: hashedPassword,
          Email: req.body.Email,
          Age: req.body.Age,
        },
      },
      { new: true }
    )
      .then((user) => {
        if (!user) {
          return res.status(404).send('Error: No user was found')
        } else {
          res.json(user)
        }
      })
      .catch((err) => {
        console.error(err)
        res.status(500).send('Error: ' + err)
      })
  }
)

// CREATE
// Add a movie to a user's list of favorites

app.post(
  '/users/:Username/movies/:MovieID',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Users.findOneAndUpdate(
      { Username: req.params.Username },
      {
        $addToSet: { FavoriteMovies: req.params.MovieID },
      },
      { new: true }
    )
      .then((updatedUser) => {
        if (!updatedUser) {
          return res.status(404).send('Error: User was not found')
        } else {
          res.json(updatedUser)
        }
      })
      .catch((error) => {
        console.error(error)
        res.status(500).send('Error: ' + error)
      })
  }
)

// DELETE a movie by movie ID
app.delete(
  '/users/:Username/movies/:MovieID',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Users.findOneAndUpdate(
      { Username: req.params.Username },
      {
        $pull: { FavoriteMovies: req.params.MovieID },
      },
      { new: true }
    )
      .then((updatedUser) => {
        if (!updatedUser) {
          return res.status(404).send('Error: User not found')
        } else {
          res.json(updatedUser)
        }
      })
      .catch((error) => {
        console.error(error)
        res.status(500).send('Error: ' + error)
      })
  }
)

// DELETE
// Delete a user by username
app.delete(
  '/users/:Username',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Users.findOneAndRemove({ Username: req.params.Username })
      .then((user) => {
        if (!user) {
          res.status(400).s
        } else {
          res.status(200).send(req.params.Username + ' was deleted.')
        }
      })
      .catch((err) => {
        console.error(err)
        res.status(500).send('Error: ' + err)
      })
  }
)

// Get all movies

app.get(
  '/movies',

  (req, res) => {
    Movies.find()
      .then((movies) => {
        res.status(201).json(movies)
      })
      .catch((err) => {
        console.error(err)
        res.status(500).send('Error: ' + err)
      })
  }
)

// Get information about a movie by its title

app.get(
  '/movies/:Title',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Movies.findOne({ Title: req.params.Title })
      .then((movie) => {
        res.json(movie)
      })
      .catch((err) => {
        console.error(err)
        res.status(500).send('Error: ' + err)
      })
  }
)

//Get data aboout all movies with a specific genre

app.get(
  '/movies/genre/:Genres',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Movies.find({ 'Genres.Name': req.params.Genres })
      .then((movies) => {
        if (movies.length == 0) {
          return res
            .status(404)
            .send(
              'Error: no movies found with the ' +
                req.params.Genres +
                ' genre type.'
            )
        } else {
          res.status(200).json(movies)
        }
      })
      .catch((err) => {
        console.error(err)
        res.status(500).send('Error: ' + err)
      })
  }
)

// Get data about a genre by genre name

app.get(
  '/movies/genredescription/:Genres',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Movies.findOne({ 'Genres.Name': req.params.Genres })
      .then((movie) => {
        if (!movie) {
          return res
            .status(404)
            .send('Error: ' + req.params.Genres + ' was not found')
        } else {
          res.status(200).json(movie.Genres.Description)
        }
      })
      .catch((err) => {
        console.error(err)
        res.status(500).send('Error: ' + err)
      })
  }
)

// get info on a director by name

app.get(
  '/movies/director/:Director',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Movies.findOne({ 'Director.lastName': req.params.Director })
      .then((movie) => {
        if (!movie) {
          return res
            .status(404)
            .send('Error: ' + req.params.Director + ' was not found')
        } else {
          res.status(200).json(movie.Director)
        }
      })
      .catch((err) => {
        console.error(err)
        res.status(500).send('Error: ' + err)
      })
  }
)

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send('Something broke!')
})

const port = process.env.PORT || 8080
app.listen(port, () => {
  console.log('Listening on Port ' + port)
})
