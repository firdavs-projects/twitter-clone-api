const {Schema, model, Types} = require('mongoose')

const schema = new Schema({
    role: {type: String, unique:true, default: 'USER'},
    users: [{type: Types.ObjectId, ref: 'User'}],
})

module.exports = model('Role', schema)
