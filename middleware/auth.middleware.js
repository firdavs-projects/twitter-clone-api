const jwt = require('jsonwebtoken')
const config = require('config')
const User = require('../models/User')
module.exports = async (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next()
  }

  try {

    const token = req.headers.authorization.split(' ')[1] //"Bearer TOKEN"
    if (!token) {
      return res.status(401).json({message: 'Пользователь не авторизован'})
    }

    const decoded = jwt.verify(token, config.get('jwtSecret'))

    await User.updateOne({_id: decoded.userId}, {$set: {lastSeen: Date.now()}})

    req.user = decoded
    next()

  } catch (e) {
    res.status(401).json({message: 'Пользователь не авторизован'})
  }
}
