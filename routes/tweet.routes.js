const {Router} = require('express')
const User = require('../models/User')
const Tweet = require('../models/Tweet')
const authMiddleware = require('../middleware/auth.middleware')
const router = Router()

// get all
router.get('/all', authMiddleware, async (req, res) => {
        try {

            const tweets = await Tweet.find({commentToTweetId: undefined})
                // .where('commentToTweetId').gte(undefined)
                .populate('tweets')
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

// get by user id
router.get('/user/:id', authMiddleware, async (req, res) => {
        try {
            const userId = req.params.id
            const user = await User.findById(userId)
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


// get by current user
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

// get by id
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

// create
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

// update by id
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        // const user = await User.findById(req.user.userId)

        const tweetId = req.params.id;
        const tweet = await Tweet.findById(tweetId)

        if (!tweet) {
            return res.status(404).json({message: 'Твит не найден'})
        }

        if (String(tweet.user) !== String(req.user.userId)) {
            return res.status(403).json({message: 'Нет доступа'})
        }

        const {text, image} = req.body

        await Tweet.updateOne({_id: tweetId}, {$set: {text, ...(image && {image})}})

        // const mainTweet = await Tweet.findById(commentToTweetId)

        // const tweet = new Tweet({
        //     user: req.user.userId,
        //     text, image, ...(mainTweet && {commentToTweetId})
        // })
        // await tweet.save()
        // await User.updateOne({_id: req.user.userId}, {$push: {tweets: tweet._id}})

        // if (mainTweet) {
        //     await Tweet.updateOne({_id: commentToTweetId}, {$push: {tweets: tweet._id}})
        // }

        res.status(201).json({message: 'Ваш твит изменен'})

    } catch (e) {
        res.status(500)
            .json({message: 'Что-то пошло не так, попробуйте снова'})
    }
})

// delete by id
router.delete('/:id', authMiddleware, async (req, res) => {
        try {
            // const user = await User.findById(req.user.userId)
            const tweetId = req.params.id
            const tweet = await Tweet.findById(tweetId)

            if (!tweet) {
                return res.status(404).json({message: 'Твит не найден'})
            }

            if (String(tweet.user) !== String(req.user.userId)) {
                return res.status(403).json({message: 'Нет доступа'})
            }

            await Tweet.deleteOne({_id: tweetId});
            res.json({message: 'Ваш твит удалён'})

        } catch
            (e) {
            res.status(500)
                .json({message: 'Что-то пошло не так, попробуйте снова'})
        }
    }
)

// ---------------------------------------------------------------------------------------------------------------//
// add remove like
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

        if (tweet.likes.includes(user._id) || user.likedTweets.includes(tweet._id)) {
            return res.status(200).json({message: 'Лайк уже добавлен'})
        }

        await User.updateOne({_id: user._id}, {$push: {likedTweets: tweet._id}})
        await Tweet.updateOne({_id: tweet._id}, {$push: {likes: user._id}})

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

        const tweetId = req.params.id;
        const tweet = await Tweet.findById(tweetId)

        if (!tweet.likes.includes(user._id) && !user.likedTweets.includes(tweet._id)) {
            return res.status(200).json({message: 'Лайк уже удален'})
        }

        const likedTweets = user.likedTweets.filter(i => String(i) !== String(tweet._id))
        await User.updateOne({_id: user._id}, {$set: {likedTweets}})

        const likes = tweet.likes.filter(i => String(i) !== String(user._id))
        await Tweet.updateOne({_id: tweet._id}, {$set: {likes}})

        res.status(200).json({message: 'Лайк удален'})


    } catch (e) {
        res.status(500)
            .json({message: 'Что-то пошло не так, попробуйте снова'})
    }
})

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
