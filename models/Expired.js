const {Schema, model} = require('mongoose')

const schema = new Schema({
    token: {type: String},
})

module.exports = model('Expired', schema)
