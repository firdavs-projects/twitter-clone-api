const {Schema, model, Types} = require('mongoose')

const schema = new Schema({
    date: {type: Date, default: Date.now},
    image: {type: String},

    text: {type: String, required: true, max: 255},

    tweets: [{type: Types.ObjectId, ref: 'Tweet'}],
    likes: [{type: Types.ObjectId, ref: 'User'}],

    user: {type: Types.ObjectId, ref: 'User'},
    commentToTweetId: {type: Types.ObjectId, ref: 'Tweet'},
})

module.exports = model('Tweet', schema)
