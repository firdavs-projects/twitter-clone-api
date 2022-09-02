const jwt = require('jsonwebtoken')
const config = require('config')
const User = require("../models/User");
const Expired = require("../models/Expired");
module.exports = async (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next()
  }

  try {
    const token = req.headers.authorization.split(' ')[1]
    if (!token) {
      return res.status(401).json({message: 'Пользователь не авторизован'})
    }

    const expired = await Expired.findOne({token})
    if (expired) {
      return res.status(401).json({message: 'Выполните вход еще раз. Токен больше не действителен'})
    }

    const userData = jwt.verify(token, config.get('jwtSecret'))
    const user = await User.findOne({_id: userData.userId})

    if (!user) {
      return res.status(404).json({message: 'Пользователь не найден'})
    }

    if (user.blocked) {
      return res.status(403).json({message: 'Пользователь заблокирован, обратитесь к администратору'})
    }

    req.user = userData
    next()

  } catch (e) {
    res.status(401).json({message: 'Пользователь не авторизован'})
  }
}
