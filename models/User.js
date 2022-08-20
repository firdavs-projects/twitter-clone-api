const {Schema, model, Types} = require('mongoose')

const schema = new Schema({
  date: {type: Date, default: Date.now},

  avatar: {type: String},
  birthDate: {type: Date},
  phone: {type: String},

  tweets: [{type: Types.ObjectId, ref: 'Tweet'}],
  likedTweets: [{type: Types.ObjectId, ref: 'Tweet'}],

  firstName: {type: String, required: true},
  lastName: {type: String, required: true},
  username: {type: String, required: true, unique: true},
  password: {type: String, required: true, min: 6},
  role: {type: Types.ObjectId, ref: 'Role'},
})

module.exports = model('User', schema)
