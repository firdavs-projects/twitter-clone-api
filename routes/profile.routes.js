const {Router} = require('express')
const User = require('../models/User')
const authMiddleware = require('../middleware/auth.middleware')
const {check, validationResult} = require("express-validator");
const bcrypt = require("bcryptjs");
const Role = require("../models/Role");
const jwt = require("jsonwebtoken");
const config = require("config");
const router = Router()

router.get(
    '/me',
    authMiddleware,
    async (req, res) => {

      try {
        const user = await User.findOne({_id: req?.user.userId})
          .populate('tweets')
          .populate('likedTweets')
          .populate('role')

        if (!user) {
          return res.status(400).json({
            message: 'Пользователь не найден'
          })
        }

        res.json(user)

      } catch (e) {
        res.status(500)
            .json({message: 'Что-то пошло не так, попробуйте снова'})
      }

    }
)

router.get(
    '/:id',
    authMiddleware,
    async (req, res) => {

        try {
            const userData = await User.findOne({_id: req.params.id})
                .populate('tweets')
                .populate('likedTweets')
                .populate('role')

            if (!userData) {
                return res.status(400).json({
                    message: 'Пользователь не найден'
                })
            }

            const user = {
                date: userData.date,

                avatar: userData.avatar,
                birthDate: userData.birthDate,
                phone: userData.phone,

                tweets: userData.tweets,
                likedTweets: userData.likedTweets,

                firstName: userData.firstName,
                lastName: userData.lastName,
                username: userData.username,
                role: userData.role.role,
            }

            res.json(user)

        } catch (e) {
            res.status(500)
                .json({message: 'Что-то пошло не так, попробуйте снова'})
        }

    }
)

router.put(
    '/',
    authMiddleware,
    [
        check('username', 'Некорректное имя пользователя').exists(),
        check('firstName', 'Некорректное имя пользователя').exists(),
        check('lastName', 'Некорректная фамилия пользователя').exists(),
    ],
    async (req, res) => {
        try {

            const errors = validationResult(req)

            if (!errors.isEmpty()) {
                return res.status(400).json({
                    errors: errors.array(),
                    message: 'Некорректные данные при изменении профиля'
                })
            }

            const current = await User.findOne({_id: req.user.userId})

            const {username, firstName, lastName, birthDate, avatar, phone} = req.body

            const candidate = await User.findOne({username})

            if (candidate && String(username) !== String(current.username)) {
                return res.status(400)
                    .json({message: 'Имя пользователя занято'})
            }

            await User.updateOne({_id: req.user.userId}, {$set: {
                username, firstName, lastName, birthDate, avatar, phone,
            }})

            res.status(201).json({message: 'Профиль изменен'})

        } catch (e) {
            console.log(e)
            res.status(500)
                .json({message: 'Что-то пошло не так, попробуйте снова'})
        }
    }
)

module.exports = router
