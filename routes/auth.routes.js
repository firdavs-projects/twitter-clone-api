const {Router} = require('express')
const bcrypt = require('bcryptjs')
const config = require('config')
const jwt = require('jsonwebtoken')
const {check, validationResult} = require('express-validator')
const User = require('../models/User')
const Role = require('../models/Role')
const Expired = require('../models/Expired')
const router = Router()

router.post(
  '/register',
  [
    check('username', 'Некорректное имя пользователя').exists(),
    check('firstName', 'Некорректное имя пользователя').exists(),
    check('lastName', 'Некорректное имя пользователя').exists(),
    check('password', 'Минимальная длина пароля 6 символов')
      .isLength({min: 6}),
  ],
  async (req, res) => {
    try {

      const errors = validationResult(req)

      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
          message: 'Некорректные данные при регистрации'
        })
      }

      const {username, password, firstName, lastName} = req.body

      const candidate = await User.findOne({username})

      if (candidate) {
        return res.status(400)
          .json({message: 'Такой пользователь уже существует'})
      }
      const hashedPassword = await bcrypt.hash(password, 6)

      const defaultRole = await Role.findOne({role: 'USER'})

      const user = new User({
        username,
        password: hashedPassword,
        firstName,
        lastName,
        role: defaultRole._id
      })
      await user.save()

      await Role.updateOne({_id: defaultRole._id}, {$push: {users: user._id}})

      const newUser = await User.findOne({username})
      const token = jwt.sign(
        {userId: newUser._id, role: defaultRole.role},
        config.get('jwtSecret'),
        {expiresIn: '48h'}
      )

      res.status(201).json({message: 'Пользователь создан', token, userId: user.id, role: defaultRole.role})

    } catch (e) {
      console.log(e)
      res.status(500)
        .json({message: 'Что-то пошло не так, попробуйте снова'})
    }
  }
)

router.post(
  '/login',
  [
    check('username', 'Некорректное имя пользователя').exists(),
    check('password', 'Введите пароль').exists()
  ],
  async (req, res) => {

    try {
      const errors = validationResult(req)

      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
          message: 'Некорректные данные при входе в систему'
        })
      }

      const {username, password} = req.body

      const user = await User.findOne({username})
          .populate('role', ['role'])

      if (!user) {
        return res.status(400).json({
          message: 'Пользователь не найден'
        })
      }

      const isMatch = await bcrypt.compare(password, user.password)

      if (!isMatch) {
        return res.status(400).json({message: 'Неверный логин или пароль, попробуйте снова'})
      }

      const token = jwt.sign(
        {userId: user._id, role: user.role.role},
        config.get('jwtSecret'),
        {expiresIn: '48h'}
      )

      res.json({token, userId: user.id, role: user.role.role})

    } catch (e) {
      res.status(500)
        .json({message: 'Что-то пошло не так, попробуйте снова'})
    }

  }
)

router.get(
    '/logout',
    async (req, res) => {
      try {
        const token = req.headers.authorization.split(' ')[1]
        if (!token) {
          return res.status(401).json({message: 'Пользователь не авторизован'})
        }

        const expired = new Expired({
          token
        })
        await expired.save()

        let twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate()-3);

        await Expired.deleteMany({"created_at" : {$lt: twoDaysAgo }})

        res.json({message: 'Токен удалён'})

      } catch (e) {
        res.status(500)
            .json({message: 'Что-то пошло не так, попробуйте снова'})
      }
    }
)

module.exports = router
