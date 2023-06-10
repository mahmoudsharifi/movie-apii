const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

let movieSchema = mongoose.Schema({
  Title: { type: String, required: true },
  Description: { type: String, required: true },
  Director: {
    firstName: String,
    lastName: String,
    Bio: String,
    dateofBirth: Number,
    dateofDeath: Number,
  },
  Genres: { Name: String, Description: String },
  Year: Number,
  ImagePath: String,
  Featured: Boolean,
})

let userSchema = mongoose.Schema({
  Username: { type: String, required: true },
  Password: { type: String, required: true },
  Email: { type: String, required: true },
  Age: Number,
  FavoriteMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],
})

userSchema.statics.hashPassword = (password) => {
  const salt = bcrypt.genSaltSync(10)
  return bcrypt.hashSync(password, salt)
}

userSchema.methods.validatePassword = function (password) {
  return bcrypt.compareSync(password, this.Password)
}

let Movie = mongoose.model('Movie', movieSchema)
let User = mongoose.model('User', userSchema)

module.exports.Movie = Movie
module.exports.User = User
