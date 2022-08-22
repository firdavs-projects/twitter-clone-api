const {Router} = require('express')
const User = require('../models/User')
const authMiddleware = require('../middleware/auth.middleware')
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

module.exports = router
