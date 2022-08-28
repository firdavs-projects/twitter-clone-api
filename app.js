const express = require('express')
const cors = require('cors')
const cookieParser = require("cookie-parser")
const connectDB = require('./config/connectDB')
const connectStorage = require('./config/connectStorage')
const http = require('http');

const app = express()
const server = http.createServer(app)
connectDB()
connectStorage()

app.use(cors())
app.use(cookieParser())
app.use(express.json({extended: true}))
app.use('/api/auth', require('./routes/auth.routes'))
app.use('/api/profile', require('./routes/profile.routes'))
app.use('/api/admin', require('./routes/admin.routes'))
app.use('/api/tweet', require('./routes/tweet.routes'))
// app.use('/api/upload', require('./routes/upload'))

const PORT = process.env.PORT || 4000

server.listen(PORT, () => {
  console.log(`App has been started on port ${PORT}`)
})
