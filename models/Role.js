const {Schema, model, Types} = require('mongoose')

const schema = new Schema({
    role: {type: String, unique:true, default: 'USER'},
    users: [{type: Types.ObjectId, ref: 'User', unique: true}],
})

module.exports = model('Role', schema)
