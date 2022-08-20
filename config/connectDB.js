const mongoose = require("mongoose");
const config = require("config");


const connectDB = async () => {
  try {
    await mongoose.connect(config.get('mongoUrl'), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true
    })
    console.log('Connected to the DataBase')
  } catch (e) {
    console.error('Server Error', e.message)
    process.exit(1)
  }
}

module.exports = connectDB
