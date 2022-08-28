const {Router} = require('express')
const User = require('../models/User')
const authMiddleware = require('../middleware/auth.middleware')
const formidable = require("formidable");
const cloudinary = require("cloudinary");
const router = Router()

router.get(
    '/top',
    authMiddleware,
    async (req, res) => {

        try {
            const users = await User.find().sort({'tweets': -1}).limit(10)
            // .populate('tweets')
            // .populate('likedTweets')
            // .populate('role')

            res.json(users)

        } catch (e) {
            res.status(500)
                .json({message: 'Что-то пошло не так, попробуйте снова'})
        }

    }
)

router.get(
    '/me',
    authMiddleware,
    async (req, res) => {

      try {
        const user = await User.findOne({_id: req?.user.userId})
          // .populate('subscriptions')
            .populate('subscriptions', ['firstName', 'lastName', 'username'])
            .populate('followers', ['firstName', 'lastName', 'username'])
          // .populate('followers')
          //   .populate('tweets')
          //   .populate('likedTweets')
          // .populate('role')

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
                .populate('subscriptions', ['firstName', 'lastName', 'username'])
                .populate('followers', ['firstName', 'lastName', 'username'])
                // .populate('subscriptions')
                // .populate('followers')
                // .populate('tweets')
                // .populate('likedTweets')
                // .populate('role')

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

                subscriptions: userData?.subscriptions || [],
                followers: userData?.followers || [],

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


const updateProfile = async (userId, fields, result, callback) => {
    const avatar = result?.secure_url ?? '';
    const {username, firstName, lastName, birthDate, phone, status} = fields;
    await User.updateOne({_id: userId}, {$set: {
        ...(username && {username}),
        ...(firstName && {firstName}),
        ...(lastName && {lastName}),
        ...(birthDate && {birthDate}),
        ...(avatar && {avatar}),
        ...(phone && {phone}),
        ...(status && {status}),
    }})
    return callback(null);
}
router.put(
    '/',
    authMiddleware,
    async (req, res) => {
        try {
            const current = await User.findOne({_id: req.user.userId})
            const {username} = req.body
            const candidate = username && await User.findOne({username})
            if (username && candidate && String(username) !== String(current.username)) {
                return res.status(400)
                    .json({message: 'Имя пользователя занято'})
            }

            const form = formidable({ multiples: true });
            form.parse(req, (err, fields, files) => {
                if (err) {return res.status(500)}

                if (files?.file?.filepath) {
                    cloudinary.v2.uploader.upload(
                        files.file.filepath,
                        { public_id: files.file.newFilename },
                        async (error, result) => {
                            if (error) {return res.status(500)}
                            updateProfile(
                                req.user.userId,
                                fields,
                                result,
                                (err) => {
                                    if (err) {return res.status(500)}
                                    res.status(201).json({message: 'Ваш твит изменен'})
                                })
                        });
                } else {
                    updateProfile(
                        req.user.userId,
                        fields,
                        null,
                        (err) => {
                            if (err) {return res.status(500)}
                            res.status(201).json({message: 'Изменения профиля сохранены'})
                        })
                }
            });
        } catch (e) {
            console.log(e)
            res.status(500)
                .json({message: 'Что-то пошло не так, попробуйте снова'})
        }
    }
)

router.delete(
    '/',
    authMiddleware,
    async (req, res) => {
        try {
            await User.deleteOne({_id: req.user.userId})
            res.status(201).json({message: 'Профиль успешно удален'})

        } catch (e) {
            console.log(e)
            res.status(500)
                .json({message: 'Что-то пошло не так, попробуйте снова'})
        }
    }
)

router.post(
    '/:id/subscribe',
    authMiddleware,
    async (req, res) => {
        try {
            const user = await User.findOne({_id: req.params.id})

            if (!user) {
                return res.status(400).json({
                    message: 'Пользователь не найден'
                })
            }

            if (String(user._id) === String(req.user.userId)) {
                return res.status(500).json({
                    message: 'Вы не можете подписаться на самого себя'
                })
            }

            if(user.followers.includes(req.user.userId)) {
                return res.status(500).json({
                    message: 'Вы уже подписаны на пользователя ' + user?.username
                })
            }

            await User.updateOne({_id: req.user.userId}, {$push: {subscriptions: user._id}})
            await User.updateOne({_id: user._id}, {$push: {followers: req.user.userId}})

            res.status(201).json({message: 'Вы подписались на пользователя '+ user?.username})

        } catch (e) {
            console.log(e)
            res.status(500)
                .json({message: 'Что-то пошло не так, попробуйте снова'})
        }
    }
)

router.delete(
    '/:id/subscribe',
    authMiddleware,
    async (req, res) => {
        try {
            const user = await User.findOne({_id: req.params.id})
            const me = await User.findOne({_id: req.user.userId})

            if (!user) {
                return res.status(400).json({
                    message: 'Пользователь не найден'
                })
            }

            if(!user.followers.includes(req.user.userId)) {
                return res.status(500).json({
                    message: 'Вы уже отписались от пользователя ' + user?.username
                })
            }

            const subscriptions = me.subscriptions.filter(i => String(i) !== String(user._id))
            await User.updateOne({_id: me._id}, {$set: {subscriptions}})

            const followers = user.followers.filter(i => String(i) !== String(me._id))
            await User.updateOne({_id: user._id}, {$set: {followers}})

            res.status(201).json({message: 'Вы отписались от пользователя '+ user?.username})

        } catch (e) {
            console.log(e)
            res.status(500)
                .json({message: 'Что-то пошло не так, попробуйте снова'})
        }
    }
)

module.exports = router
