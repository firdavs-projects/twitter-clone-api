const {Router} = require('express')
const User = require('../models/User')
const Tweet = require('../models/Tweet')
const authMiddleware = require('../middleware/auth.middleware')
const router = Router()

router.get('/', authMiddleware, async (req, res) => {
        try {
            const user = await User.findById(req.user.userId)

            if (!user) {
                return res.status(400).json({
                    message: 'Пользователь не найден'
                })
            }

            const tweets = await Tweet.find({_id: user.tweets})
                // .populate('tweets')
                // .populate('likes')
                // .populate('commentToTweetId')

            res.json({tweets})

        } catch
            (e) {
            res.status(500)
                .json({message: 'Что-то пошло не так, попробуйте снова'})
        }
    }
)

router.post('/', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)

        if (!user) {
            return res.status(400).json({
                message: 'Пользователь не найден'
            })
        }
        const {text, image, commentToTweetId} = req.body

        const mainTweet = await Tweet.findById(commentToTweetId)

        const tweet = new Tweet({
            user: req.user.userId,
            text, image, ...(mainTweet && {commentToTweetId})
        })
        await tweet.save()
        await User.updateOne({_id: req.user.userId}, {$push: {tweets: tweet._id}})

        if (mainTweet) {
            await Tweet.updateOne({_id: commentToTweetId}, {$push: {tweets: tweet._id}})
        }

        res.status(201).json({message: 'Новый твит создан', tweet, userId: req.user.userId})

    } catch (e) {
        res.status(500)
            .json({message: 'Что-то пошло не так, попробуйте снова'})
    }
})

// ---------------------------------------------------------------------------------------------------------------//

router.post('/:id/like', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
        if (!user) {
            return res.status(400).json({
                message: 'Пожалуйста сначала выполните вход'
            })
        }

        const id = req.params.id;
        const tweet = await Tweet.findById(id)

        if (tweet.likes.includes(user._id)) {
            return res.status(200).json({message: 'Лайк уже добавлен'})
        }

        await User.updateOne({_id: user._id}, {$push: {likedTweets: id}})
        await Tweet.updateOne({_id: id}, {$push: {likes: user._id}})

        res.status(201).json({message: 'Лайк добавлен'})

    } catch (e) {
        res.status(500)
            .json({message: 'Что-то пошло не так, попробуйте снова'})
    }
})

router.delete('/:id/like', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
        if (!user) {
            return res.status(400).json({
                message: 'Пожалуйста сначала выполните вход'
            })
        }

        const id = req.params.id;
        const tweet = await Tweet.findById(id)

        if (tweet.likes.includes(user._id)) {
            // await User.updateOne({_id: user._id}, {$push: {likedTweets: id}})
            // await Tweet.updateOne({_id: id}, {$push: {likes: user._id}})
            return res.status(200).json({message: 'Лайк удален'})
        }

        res.status(200).json({message: 'Лайк уже удален'})

    } catch (e) {
        res.status(500)
            .json({message: 'Что-то пошло не так, попробуйте снова'})
    }
})

router.get('/:id', authMiddleware, async (req, res) => {
        try {
            const user = await User.findById(req.user.userId)
            if (!user) {
                return res.status(400).json({
                    message: 'Пользователь не найден'
                })
            }

            const id = req.params.id;
            const tweet = await Tweet.findById(id)
                // .populate('tweets')
                // .populate('likes')
                // .populate('commentToTweetId')

            if (tweet) {
                res.json({tweet})
            }

            res.status(404).json({message: "Твит не найден"})
        } catch
            (e) {
            res.status(500)
                .json({message: 'Что-то пошло не так, попробуйте снова'})
        }
    }
)

// router.delete('/like', authMiddleware, async (req, res) => {
//     try {
//         const user = await User.findById(req.user.userId)
//
//         if (!user) {
//             return res.status(400).json({
//                 message: 'Пожалуйста сначала выполните вход'
//             })
//         }
//
//         const {tweet} = req.body
//         // const like = await Like.findById(id)
//         // if (like) {
//         //     // await Like.deleteOne({_id: id})
//         //     // await User.updateOne({_id: req.user.userId}, {$push: {likedTweets: tweet}})
//         //     // await Tweet.updateOne({_id: tweet}, {$push: {likes: like._id}})
//         //
//         // }
//
//
//     } catch (e) {
//         res.status(500)
//             .json({message: 'Что-то пошло не так, попробуйте снова'})
//     }
// })

// router.get('/currency', async (req, res) => {
//     try {
//
//         const currency = await Currency.find({})
//         res.json(currency)
//
//     } catch (e) {
//         res.status(500)
//             .json({message: 'Что-то пошло не так, попробуйте снова'})
//     }
// })

// ---------------------------------------------------------------------------------------------------------------//

// router.post('/type/add', authMiddleware, async (req, res) => {
//     try {
//         const user = await User.findById(req.user.userId)
//
//         if (!user) {
//             return res.status(400).json({
//                 message: 'Пожалуйста сначала выполните вход'
//             })
//         }
//         const {name, icon} = req.body
//
//         const type = new Type({
//             name, icon
//         })
//
//         await type.save()
//         res.status(201).json({message: 'Новый тип добавлен', type})
//
//     } catch (e) {
//         res.status(500)
//             .json({message: 'Что-то пошло не так, попробуйте снова'})
//     }
// })

// router.get('/type', async (req, res) => {
//     try {
//
//         const type = await Type.find({})
//         res.json(type)
//
//     } catch (e) {
//         res.status(500)
//             .json({message: 'Что-то пошло не так, попробуйте снова'})
//     }
// })

module.exports = router
