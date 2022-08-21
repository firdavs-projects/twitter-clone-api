const express = require('express')
const multer = require('multer');
const cors = require('cors')
const cookieParser = require("cookie-parser")
const connectDB = require('./config/connectDB')
const http = require('http');

const app = express()
const server = http.createServer(app)
connectDB()

app.use(cors())
app.use(cookieParser())
app.use(express.json({extended: true}))

app.use('/api/admin', require('./routes/admin.routes'))
app.use('/api/auth', require('./routes/auth.routes'))
app.use('/api/tweet', require('./routes/tweet.routes'))
// app.use('/api/category', require('./routes/category.routes'))
// app.use('/api/transaction', require('./routes/transaction.routes'))
app.use('/upload', express.static('upload'))

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'upload')
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`)
  }
})
const upload = multer({storage: storage}).single('file')
app.post("/api/upload", (req, res) => {
  upload(req, res, err => {
    if (err) {
      return res.status(500)
        .json({message: 'Что-то пошло не так, попробуйте снова'})
    }
    return res.json({message: 'Файл успешно загружён', url: res.req.file.filename})
  })
})

const PORT = process.env.PORT || 5000

server.listen(PORT, () => {
  console.log(`App has been started on port ${PORT}`)
})
